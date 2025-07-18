import requests
from celery.utils.log import get_task_logger
from constance import config
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.template import loader

from core.api.utils import (
    COUNTRY_USER_GROUP,
    COUNTRY_SUBMITTER_GROUP,
)
from core.forms import CountryUserPasswordResetForm
from core.import_data.utils import parse_date
from core.models.country_programme import CPComment, CPReport
from core.models.meeting import Decision, Meeting
from core.models import Project

from multilateralfund.celery import app


logger = get_task_logger(__name__)
User = get_user_model()
# pylint: disable=W0718


# Projects
@app.task()
def send_project_submission_notification(project_ids):
    projects = Project.objects.filter(id__in=project_ids)

    recipients = config.PROJECT_SUBMISSION_NOTIFICATION_EMAILS
    if type(recipients) is str:
        recipients = recipients.split(",")
    if not recipients:
        return

    context = {
        "projects": projects,
    }
    subject_template_name = (
        "email_templates/project_submission_notification_subject.txt",
    )
    email_template_name = ("email_templates/project_submission_notification.txt",)
    html_email_template_name = ("email_templates/project_submission_notification.html",)
    subject = loader.render_to_string(subject_template_name, context)
    # Email subject *must not* contain newlines
    subject = "".join(subject.splitlines())
    body = loader.render_to_string(email_template_name, context)

    email_message = EmailMultiAlternatives(
        subject,
        body,
        None,
        recipients,
    )

    html_email = loader.render_to_string(html_email_template_name, context)
    email_message.attach_alternative(html_email, "text/html")
    email_message.send()


# Country Programme
@app.task()
def send_mail_comment_submit(cp_comment_id):
    cp_comment = get_object_or_404(CPComment, id=cp_comment_id)
    cp_report = cp_comment.country_programme_report
    link = f"{settings.FRONTEND_HOST[0]}/country-programme/{cp_report.country.iso3}/{cp_report.year}"
    comment_section = CPComment.CPCommentSection(cp_comment.section).label

    if cp_comment.comment_type == CPComment.CPCommentType.COMMENT_COUNTRY:
        recipients = config.CP_NOTIFICATION_EMAILS
    else:
        recipients = User.objects.filter(
            groups__name__in=[COUNTRY_USER_GROUP, COUNTRY_SUBMITTER_GROUP],
            country=cp_report.country,
        ).values_list("email", flat=True)
    if not recipients:
        return

    send_mail(
        "MLF Knowledge Management System: New comment added for CP report",
        (
            f"This is an automated message informing you that a new "
            f"comment was added for the CP report of country: {cp_report.country} "
            f"and year: {cp_report.year} ({comment_section}).\n\n"
            f"The CP report is available at {link}"
        ),
        None,  # use DEFAULT_FROM_EMAIL
        recipients,
        fail_silently=False,
    )


@app.task()
def send_mail_report_create(cp_report_id):
    cp_report = get_object_or_404(CPReport, id=cp_report_id)
    link = f"{settings.FRONTEND_HOST[0]}/country-programme/{cp_report.country.iso3}/{cp_report.year}"
    recipients = config.CP_NOTIFICATION_EMAILS
    if not recipients:
        return

    send_mail(
        "MLF Knowledge Management System: CP report added",
        (
            f"This is an automated message informing you that a new "
            f"CP report has been added for country: "
            f"{cp_report.country} and year: {cp_report.year}.\n\n"
            f"The CP report is available at {link}"
        ),
        None,  # use DEFAULT_FROM_EMAIL
        recipients,
        fail_silently=False,
    )


@app.task()
def send_mail_report_update(cp_report_id):
    cp_report = get_object_or_404(CPReport, id=cp_report_id)
    link = f"{settings.FRONTEND_HOST[0]}/country-programme/{cp_report.country.iso3}/{cp_report.year}"
    recipients = config.CP_NOTIFICATION_EMAILS
    if not recipients:
        return

    send_mail(
        "MLF Knowledge Management System: New version of CP report added",
        (
            f"This is an automated message informing you that a new "
            f"version ({cp_report.version}) has been added for the CP report "
            f"for country: {cp_report.country} and year: {cp_report.year}.\n\n"
            f"The CP report is available at {link}"
        ),
        None,  # use DEFAULT_FROM_EMAIL
        recipients,
        fail_silently=False,
    )


@app.task()
def send_mail_set_password_country_user(user_emails):
    for user_email in user_emails:
        try:
            form = CountryUserPasswordResetForm({"email": user_email})
            if not form.is_valid():
                logger.error(f"Password reset mail error: {user_email}")
                continue

            country_inputter = User.objects.filter(
                email=user_email, groups__name=COUNTRY_USER_GROUP
            ).first()
            password_inputter = User.objects.make_random_password(length=12)
            country_inputter.set_password(password_inputter)
            country_inputter.save()

            country_submitter = User.objects.filter(
                email=user_email, groups__name=COUNTRY_SUBMITTER_GROUP
            ).first()
            password_submitter = User.objects.make_random_password(length=12)
            country_submitter.set_password(password_submitter)
            country_submitter.save()

            form.save(
                domain_override=settings.FRONTEND_HOST[0],
                subject_template_name="registration/create_new_country_user_subject.txt",
                email_template_name="registration/create_new_country_user_email.txt",
                html_email_template_name="registration/create_new_country_user_email.html",
                use_https=settings.HAS_HTTPS,
                extra_email_context={
                    "username_inputter": country_inputter.username,
                    "password_inputter": password_inputter,
                    "username_submitter": country_submitter.username,
                    "password_submitter": password_submitter,
                },
            )
            logger.info(f"Password reset mail sent successfully to {user_email}!")
        except Exception as e:
            logger.error(f"Could not send password email to {user_email} - {str(e)}")


@app.task()
def synchronize_meetings():
    if not settings.DRUPAL_MEETINGS_API:
        return

    def get_meetings(json_data):
        """
        Extract start/end dates and other attrs for all node--events in the
        meetings API JSON data.
        """
        meetings = []

        for item in json_data.get("data", []):
            if item.get("type") == "node--event":
                attributes = item.get("attributes", {})
                date_range = attributes.get("field_date_range")
                number = attributes.get("field_number")
                title = attributes.get("title")
                if date_range and number and title:
                    start_date = date_range.get("value")
                    end_date = date_range.get("end_value")
                    internal_api_id = attributes.get("drupal_internal__nid")
                    if start_date and end_date:
                        start_date = parse_date(start_date)
                        end_date = parse_date(end_date)
                        meetings.append(
                            Meeting(
                                date=start_date,
                                end_date=end_date,
                                number=number,
                                title=title,
                                internal_api_id=internal_api_id,
                            )
                        )
        return meetings

    logger.info("Synchronizing meetings...")
    meetings_response = requests.get(
        settings.DRUPAL_MEETINGS_API, timeout=settings.DRUPAL_API_TIMEOUT
    )
    meetings_response.raise_for_status()
    meetings_json = meetings_response.json()
    meeting_objects = get_meetings(meetings_json)

    Meeting.objects.bulk_create(
        meeting_objects,
        update_conflicts=True,
        unique_fields=["number"],
        update_fields=["date", "end_date", "title", "internal_api_id"],
    )
    logger.info("Meetings synchronized successfully")


@app.task()
def synchronize_decisions():
    if not settings.DRUPAL_DECISIONS_API:
        return

    def get_decisions(json_data):
        """
        Extract Decisions attributes for all node--decision items in the JSON data.
        """
        decisions = []

        for item in json_data.get("data", []):
            if item.get("type") == "node--decision":
                attributes = item.get("attributes", {})
                title = attributes.get("title")
                number = attributes.get("field_decision_number")
                title = attributes.get("field_decision_number")

                relationships = item.get("relationships", {})
                meeting_internal_api_id = (
                    relationships.get("field_event", {})
                    .get("data", {})
                    .get("meta", {})
                    .get("drupal_internal__target_id")
                )
                meeting_id = None
                if meeting_internal_api_id:
                    meeting = Meeting.objects.filter(
                        internal_api_id=meeting_internal_api_id
                    ).first()
                    meeting_id = meeting.id if meeting else None
                if number and title:
                    decisions.append(
                        Decision(
                            number=number,
                            title=title,
                            meeting_id=meeting_id,
                        )
                    )
        return decisions

    logger.info("Synchronizing decisions...")
    decisions_response = requests.get(
        settings.DRUPAL_DECISIONS_API, timeout=settings.DRUPAL_API_TIMEOUT
    )
    decisions_response.raise_for_status()
    decisions_json = decisions_response.json()
    decisions_objects = get_decisions(decisions_json)

    Decision.objects.bulk_create(
        decisions_objects,
        update_conflicts=True,
        unique_fields=["number"],
        update_fields=["title"],
    )
    logger.info("Decisions synchronized successfully")
