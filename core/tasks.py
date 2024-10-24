from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404

from core.forms import CountryUserPasswordResetForm
from core.models.business_plan import BusinessPlan
from core.models.country_programme import CPComment, CPReport
from multilateralfund.celery import app

logger = get_task_logger(__name__)
User = get_user_model()
# pylint: disable=W0718


# Country Programme
@app.task()
def send_mail_comment_submit(cp_comment_id):
    cp_comment = get_object_or_404(CPComment, id=cp_comment_id)
    cp_report = cp_comment.country_programme_report
    link = f"{settings.FRONTEND_HOST[0]}/country-programme/{cp_report.country.iso3}/{cp_report.year}"
    comment_section = CPComment.CPCommentSection(cp_comment.section).label

    if cp_comment.comment_type == CPComment.CPCommentType.COMMENT_COUNTRY:
        recipients = User.objects.filter(user_type=User.UserType.SECRETARIAT)
    else:
        recipients = User.objects.filter(
            user_type__in=[User.UserType.COUNTRY_USER, User.UserType.COUNTRY_SUBMITTER],
            country=cp_report.country,
        )

    send_mail(
        "MLF Knowledge Management System: New comment added for CP report",
        (
            f"This is an automated message informing you that a new "
            f"comment was added for the CP report of country: {cp_report.country} "
            f"and year: {cp_report.year} ({comment_section}).\n\n"
            f"The CP report is available at {link}"
        ),
        None,  # use DEFAULT_FROM_EMAIL
        recipients.values_list("email", flat=True),
        fail_silently=False,
    )


@app.task()
def send_mail_report_create(cp_report_id):
    cp_report = get_object_or_404(CPReport, id=cp_report_id)
    link = f"{settings.FRONTEND_HOST[0]}/country-programme/{cp_report.country.iso3}/{cp_report.year}"
    recipients = User.objects.filter(user_type=User.UserType.SECRETARIAT)

    send_mail(
        "MLF Knowledge Management System: CP report added",
        (
            f"This is an automated message informing you that a new "
            f"CP report has been added for country: "
            f"{cp_report.country} and year: {cp_report.year}.\n\n"
            f"The CP report is available at {link}"
        ),
        None,  # use DEFAULT_FROM_EMAIL
        recipients.values_list("email", flat=True),
        fail_silently=False,
    )


@app.task()
def send_mail_report_update(cp_report_id):
    cp_report = get_object_or_404(CPReport, id=cp_report_id)
    link = f"{settings.FRONTEND_HOST[0]}/country-programme/{cp_report.country.iso3}/{cp_report.year}"
    recipients = User.objects.filter(user_type=User.UserType.SECRETARIAT)

    send_mail(
        "MLF Knowledge Management System: New version of CP report added",
        (
            f"This is an automated message informing you that a new "
            f"version ({cp_report.version}) has been added for the CP report "
            f"for country: {cp_report.country} and year: {cp_report.year}.\n\n"
            f"The CP report is available at {link}"
        ),
        None,  # use DEFAULT_FROM_EMAIL
        recipients.values_list("email", flat=True),
        fail_silently=False,
    )


# Business Plan
@app.task()
def send_mail_bp_create(business_plan_id):
    business_plan = get_object_or_404(BusinessPlan, id=business_plan_id)
    link = (
        f"{settings.FRONTEND_HOST[0]}/business-plans/{business_plan.agency.name}/"
        f"{business_plan.year_start}/{business_plan.year_end}"
    )
    recipients = User.objects.filter(user_type=User.UserType.SECRETARIAT)

    send_mail(
        "MLF Knowledge Management System: Business Plan added",
        (
            f"This is an automated message informing you that a new "
            f"Business Plan has been added for agency: {business_plan.agency} "
            f"and years: {business_plan.year_start} - {business_plan.year_end}.\n\n"
            f"The Business Plan is available at {link}"
        ),
        None,  # use DEFAULT_FROM_EMAIL
        recipients.values_list("email", flat=True),
        fail_silently=False,
    )


@app.task()
def send_mail_bp_update(business_plan_id):
    business_plan = get_object_or_404(BusinessPlan, id=business_plan_id)
    link = (
        f"{settings.FRONTEND_HOST[0]}/business-plans/{business_plan.agency.name}/"
        f"{business_plan.year_start}/{business_plan.year_end}"
    )
    recipients = User.objects.filter(user_type=User.UserType.SECRETARIAT)

    send_mail(
        "MLF Knowledge Management System: New version of Business Plan added",
        (
            f"This is an automated message informing you that a new "
            f"version ({business_plan.version}) has been added for the Business Plan "
            f"for agency: {business_plan.agency} and years: "
            f"{business_plan.year_start} - {business_plan.year_end}.\n\n"
            f"The Business Plan is available at {link}"
        ),
        None,  # use DEFAULT_FROM_EMAIL
        recipients.values_list("email", flat=True),
        fail_silently=False,
    )


@app.task()
def send_mail_bp_status_update(business_plan_id):
    business_plan = get_object_or_404(BusinessPlan, id=business_plan_id)
    link = (
        f"{settings.FRONTEND_HOST[0]}/business-plans/{business_plan.agency.name}/"
        f"{business_plan.year_start}/{business_plan.year_end}"
    )
    recipients = User.objects.filter(
        user_type__in=[User.UserType.AGENCY_SUBMITTER, User.UserType.AGENCY_INPUTTER],
        agency=business_plan.agency,
    )
    action = business_plan.status

    send_mail(
        "MLF Knowledge Management System: Business Plan added",
        (
            f"This is an automated message informing you that the "
            f"Business Plan for years: {business_plan.year_start} - "
            f"{business_plan.year_end} has been {action}.\n\n"
            f"The Business Plan is available at {link}"
        ),
        None,  # use DEFAULT_FROM_EMAIL
        recipients.values_list("email", flat=True),
        fail_silently=False,
    )


@app.task()
def send_mail_set_password_country_user(country_ids):
    for country_id in country_ids:
        try:
            country_users = User.objects.filter(country_id=country_id)
            user_email = country_users.first().email  # 2 users, 1 email
            form = CountryUserPasswordResetForm({"email": user_email})
            if not form.is_valid() or country_users.count() != 2:
                logger.error(f"Password reset mail error: {user_email}")
                continue

            country_inputter = country_users.filter(
                user_type=User.UserType.COUNTRY_USER
            ).first()
            password_inputter = User.objects.make_random_password(length=12)
            country_inputter.set_password(password_inputter)
            country_inputter.save()

            country_submitter = country_users.filter(
                user_type=User.UserType.COUNTRY_SUBMITTER
            ).first()
            password_submitter = User.objects.make_random_password(length=12)
            country_submitter.set_password(password_submitter)
            country_submitter.save()

            form.save(
                domain_override=settings.FRONTEND_HOST[0],
                subject_template_name="registration/create_new_country_user_subject.txt",
                email_template_name="registration/create_new_country_user_email.html",
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
            logger.error(
                f"Could not send password email for Country: {country_id} - {str(e)}"
            )
