from urllib.parse import urlencode
from datetime import datetime

import requests
from celery.utils.log import get_task_logger
from constance import config
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import models as django_models
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.template import loader

from core.api.filters.annual_project_reports import APRProjectFilter
from core.api.utils import (
    COUNTRY_USER_GROUP,
    COUNTRY_SUBMITTER_GROUP,
    get_previous_year_project_reports,
    log_project_history,
)
from core.forms import CountryUserPasswordResetForm
from core.import_data.utils import parse_date
from core.models.country_programme import CPComment, CPReport
from core.models.meeting import Decision, Meeting
from core.models import (
    Project,
    AnnualAgencyProjectReport,
    AnnualProjectReport,
    AnnualProgressReport,
    ProjectStatus,
)

from multilateralfund.celery import app


logger = get_task_logger(__name__)
User = get_user_model()
# pylint: disable=W0718

APR_VERSIONING_START_YEAR = 2025


def send_html_mail(
    context: dict,
    email_template_name: tuple[str],
    html_email_template_name: tuple[str],
    recipients: list[str],
    subject_template_name: tuple[str],
):
    subject = loader.render_to_string(subject_template_name, context)
    # Email subject *must not* contain newlines
    subject = "".join(subject.splitlines())
    body = loader.render_to_string(email_template_name, context)

    email_message = EmailMultiAlternatives(
        subject,
        body,
        None,
        bcc=recipients,
    )

    html_email = loader.render_to_string(html_email_template_name, context)
    email_message.attach_alternative(html_email, "text/html")
    email_message.send()


# Annual Progress Report
@app.task()
def update_project_statuses_after_apr_endorsement(progress_report_id):
    """
    When an AnnualProgressReport is endorsed and year >= 2025,
    create a new version for every project whose status was changed during the APR cycle.

    Single-project failures are logged and admins notified, but other projects
    continue to be processed.
    """
    try:
        progress_report = AnnualProgressReport.objects.get(id=progress_report_id)
    except AnnualProgressReport.DoesNotExist:
        logger.error(
            "APR endorsement: AnnualProgressReport %s not found.",
            progress_report_id,
        )
        return

    if progress_report.year < APR_VERSIONING_START_YEAR:
        return

    if not progress_report.endorsed:
        logger.error(
            "APR endorsement: AnnualProgressReport %s is not endorsed.",
            progress_report_id,
        )
        return

    year = progress_report.year

    apr_entries = (
        AnnualProjectReport.objects.filter(
            report__progress_report=progress_report,
        )
        .exclude(status="")
        .select_related("project__status", "report__submitted_by")
        .order_by("id")
    )

    processed_project_ids = set()
    failures = []

    for entry in apr_entries:
        project = entry.project

        if project.id in processed_project_ids:
            continue

        if entry.status == project.status.name:
            processed_project_ids.add(project.id)
            continue

        new_status = ProjectStatus.objects.filter(name=entry.status).first()
        if new_status is None:
            logger.error(
                "APR endorsement: Unknown status name '%s' for project %s. Skipping.",
                entry.status,
                project.id,
            )
            processed_project_ids.add(project.id)
            continue

        user = entry.report.submitted_by
        if user is None:
            logger.error(
                "APR endorsement: No submitted_by user for agency report %s "
                "(project %s). Skipping.",
                entry.report.id,
                project.id,
            )
            processed_project_ids.add(project.id)
            continue

        try:
            with transaction.atomic():
                prev_status_name = project.status.name
                project.increase_version(user)
                project.status = new_status
                project.save(update_fields=["status"])
                log_project_history(
                    project,
                    user,
                    f"APR {year}: Status changed from {prev_status_name} to {new_status.name}",
                )
            processed_project_ids.add(project.id)
        except Exception:
            logger.exception(
                "APR endorsement: Failed to update project %s for APR year %s.",
                project.id,
                year,
            )
            processed_project_ids.add(project.id)
            failures.append(project.id)

    if failures:
        recipients = config.APR_AGENCY_SUBMISSION_NOTIFICATIONS_EMAILS
        if isinstance(recipients, str):
            recipients = [r.strip() for r in recipients.split(",")]
        recipients = [r for r in recipients if r]

        if recipients:
            project_ids_str = ", ".join(str(pid) for pid in failures)
            send_mail(
                subject=f"APR {year}: Failed to update project statuses after endorsement",
                message=(
                    f"The following project IDs failed to have their status updated "
                    f"after endorsing APR {year}: {project_ids_str}.\n\n"
                    f"Please check the application logs for details."
                ),
                from_email=None,
                recipient_list=recipients,
                fail_silently=True,
            )


@app.task()
def send_agency_submission_notification(agency_report_id):
    recipients = config.APR_AGENCY_SUBMISSION_NOTIFICATIONS_EMAILS
    if isinstance(recipients, str):
        recipients = [recipient.strip() for recipient in recipients.split(",")]

    if not recipients:
        return

    agency_report = AnnualAgencyProjectReport.objects.select_related(
        "agency", "progress_report"
    ).get(id=agency_report_id)

    context = {"apr": agency_report}
    subject_template_name = (
        "email_templates/apr_agency_submit_notification_subject.txt",
    )
    email_template_name = ("email_templates/apr_agency_submit_notification.txt",)
    html_email_template_name = ("email_templates/apr_agency_submit_notification.html",)
    send_html_mail(
        context,
        email_template_name,
        html_email_template_name,
        recipients,
        subject_template_name,
    )


# Projects
@app.task()
def send_project_submission_notification(project_ids):
    projects = Project.objects.filter(id__in=project_ids)

    recipients = config.PROJECT_SUBMISSION_NOTIFICATIONS_EMAILS
    if isinstance(recipients, str):
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
    send_html_mail(
        context,
        email_template_name,
        html_email_template_name,
        recipients,
        subject_template_name,
    )


@app.task()
def send_project_recommended_notification(project_ids):
    projects = Project.objects.filter(id__in=project_ids)

    recipients = config.PROJECT_RECOMMENDATION_NOTIFICATIONS_EMAILS
    if isinstance(recipients, str):
        recipients = recipients.split(",")

    subject_template_name = (
        "email_templates/project_submission_notification_subject.txt",
    )
    email_template_name = ("email_templates/project_submission_notification.txt",)
    html_email_template_name = ("email_templates/project_submission_notification.html",)
    # Notify MLFS first
    if recipients:
        context = {
            "projects": projects,
        }

        send_html_mail(
            context,
            email_template_name,
            html_email_template_name,
            recipients,
            subject_template_name,
        )

    # Notify project creators
    archived_versions = Project.objects.really_all().filter(
        latest_project__in=project_ids, version=1
    )
    creating_recipients = User.objects.filter(
        created_projects_version__in=archived_versions
    ).distinct()
    for user in creating_recipients:
        if not user.email:
            continue
        recipients = [user.email]
        context = {
            "projects": [
                archived_version.latest_project
                for archived_version in archived_versions
                if archived_version.version_created_by == user
            ],
        }

        send_html_mail(
            context,
            email_template_name,
            html_email_template_name,
            recipients,
            subject_template_name,
        )


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
                        yield Meeting(
                            date=start_date,
                            end_date=end_date,
                            number=number,
                            title=title,
                            internal_api_id=internal_api_id,
                        )

    logger.info("Synchronizing meetings...")

    session = requests.sessions.Session()

    def fetch_meetings(url):
        logger.info("Fetching from %s...", url)

        meetings_response = session.get(url, timeout=settings.DRUPAL_API_TIMEOUT)
        meetings_response.raise_for_status()
        meetings_json = meetings_response.json()
        yield from get_meetings(meetings_json)
        next_url = meetings_json.get("links", {}).get("next", {}).get("href", "")
        if next_url:
            yield from fetch_meetings(next_url)

    meeting_objects = fetch_meetings(settings.DRUPAL_MEETINGS_API)

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

    session = requests.sessions.Session()

    meetings = {m.internal_api_id: m.id for m in Meeting.objects.all()}
    latest_decision = (
        Decision.objects.filter(api_changed__isnull=False)
        .order_by("-api_changed")
        .first()
    )

    def get_decision_text(relationships, included):
        result = ""
        field = relationships.get("field_content", {})
        field_id = field.get("data", [{}])[0].get("id")
        if field_id:
            attributes = included.get(field_id, {}).get("attributes", {})
            result = attributes.get("field_body", {}).get("value", "")
        return result

    def get_decisions(json_data):
        """
        Extract Decisions attributes for all node--decision items in the JSON data.
        """
        included = {i["id"]: i for i in json_data.get("included", [])}
        for item in json_data.get("data", []):
            if item.get("type") == "node--decision":
                attributes = item.get("attributes", {})
                title = attributes.get("title")
                number = attributes.get("field_decision_number")
                internal_api_id = attributes.get("drupal_internal__nid")
                api_changed = datetime.fromisoformat(attributes.get("changed"))
                relationships = item.get("relationships", {})
                try:
                    meeting_internal_api_id = (
                        relationships.get("field_event", {})
                        .get("data", {})
                        .get("meta", {})
                        .get("drupal_internal__target_id")
                    )
                except AttributeError:
                    logger.info(
                        "Skipping decision without meeting: %s",
                        (title, number, internal_api_id),
                    )
                    continue

                # Decision text.
                pseudo_content_preview = attributes.get("pseudo_content_preview")
                decision_text = get_decision_text(relationships, included)

                meeting_id = meetings.get(meeting_internal_api_id, None)
                yield Decision(
                    number=number,
                    title=title,
                    meeting_id=meeting_id,
                    internal_api_id=internal_api_id,
                    api_changed=api_changed,
                    pseudo_content_preview=pseudo_content_preview,
                    text=decision_text,
                )

    logger.info("Synchronizing decisions...")

    def fetch_decisions(url):
        logger.info("Fetching from %s...", url)
        decisions_response = session.get(url, timeout=settings.DRUPAL_API_TIMEOUT)
        decisions_response.raise_for_status()
        decisions_json = decisions_response.json()
        yield from get_decisions(decisions_json)
        next_url = decisions_json.get("links", {}).get("next", {}).get("href", "")
        if next_url:
            yield from fetch_decisions(next_url)

    decisions_url_params = {
        "include": "field_content",
        "fields[paragraph--edw_rich_text]": "field_body",
        "sort": "-changed",
    }

    if latest_decision and latest_decision.api_changed:
        decisions_url_params.update(
            {
                "filter[changed][operator]": ">",
                "filter[changed][value]": latest_decision.api_changed.isoformat(),
            }
        )

    decisions_url = f"{settings.DRUPAL_DECISIONS_API}?{urlencode(decisions_url_params)}"
    decisions_objects = fetch_decisions(decisions_url)

    Decision.objects.bulk_create(
        decisions_objects,
        update_conflicts=True,
        unique_fields=["internal_api_id"],
        update_fields=[
            "title",
            "number",
            "meeting_id",
            "pseudo_content_preview",
            "text",
            "api_changed",
        ],
    )
    logger.info("Decisions synchronized successfully")


@app.task()
def sync_apr_from_projects(year):
    """
    Re-synchronize all APR derived fields for a reporting year, for all agencies,
    from the current Project data.

    Only records whose values actually changed are written to the DB,
    so runs where the state has not actually changed are fast.

    This runs in two phases:
    - it first updates existing APRs based on changed Project data
    - it then creates specific APRs for projects that have been approved *after*
      the initial AnnualAgencyProjectReport has been created.
      If there is no AnnualAgencyProjectReport for a specific agency (e.g. the workspace
      has not been accessed yet), it will not create new AnnualProjectReport records.
    """
    # pylint: disable=R0914
    progress_report = AnnualProgressReport.objects.get(year=year)

    if progress_report.endorsed:
        return {
            "updated_count": 0,
            "changed_count": 0,
            "added_count": 0,
            "agencies_count": 0,
            "message": f"APR for year {year} is already endorsed. No sync performed.",
        }

    project_reports = list(
        AnnualProjectReport.objects.filter(
            report__progress_report=progress_report
        ).select_related(
            "project",
            "project__agency",
            "project__cluster",
            "project__country__parent",
            "project__sector",
            "project__project_type",
            "project__status",
            "project__post_excom_decision__meeting",
            "report__progress_report",
        )
    )

    if not project_reports:
        return {
            "updated_count": 0,
            "changed_count": 0,
            "added_count": 0,
            "agencies_count": 0,
            "message": "No project reports to sync.",
        }

    agencies_count = len({pr.report_id for pr in project_reports})

    # Build a map of existing project IDs per agency report from already-fetched data,
    # to avoid one DB query per agency in the second phase (project "pull") below.
    existing_by_report_id: dict[int, set[int]] = {}
    for pr in project_reports:
        existing_by_report_id.setdefault(pr.report_id, set()).add(pr.project_id)

    # Collect unique final-project ids
    final_project_ids = set()
    for pr in project_reports:
        final_project_ids.add(pr.project.latest_project_id or pr.project.id)

    # Loading related project data in-memory and caching it on projects
    # so that all calculations in populate_derived_fields() are sped up.

    # Batch-load version 3 projects (ods_odp needed for phase-out calculations)
    version_3_map = {
        (p.latest_project_id or p.id): p
        for p in Project.objects.really_all()
        .filter(
            django_models.Q(id__in=final_project_ids)
            | django_models.Q(latest_project_id__in=final_project_ids),
            version=3,
        )
        .select_related("status", "post_excom_decision__meeting")
        .prefetch_related("ods_odp")
    }

    # Batch-load latest version approved in or before `year`
    latest_version_map = {}
    for p in (
        Project.objects.really_all()
        .filter(
            django_models.Q(id__in=final_project_ids)
            | django_models.Q(latest_project_id__in=final_project_ids),
            post_excom_decision__isnull=False,
            post_excom_decision__meeting__date__year__lte=year,
        )
        .select_related("status", "post_excom_decision__meeting")
        .order_by("-post_excom_decision__meeting__date", "-version")
    ):
        project_key = p.latest_project_id or p.id
        if project_key not in latest_version_map:
            latest_version_map[project_key] = p

    # Batch-load all versions approved during `year`
    all_versions_map: dict = {}
    for p in (
        Project.objects.really_all()
        .filter(
            django_models.Q(id__in=final_project_ids)
            | django_models.Q(latest_project_id__in=final_project_ids),
            django_models.Q(
                post_excom_decision__isnull=False,
                post_excom_decision__meeting__date__year=year,
            )
            | django_models.Q(post_excom_decision__isnull=True, version=3),
        )
        .select_related("status")
    ):
        project_key = p.latest_project_id or p.id
        all_versions_map.setdefault(project_key, []).append(p)

    to_update = []
    for project_report in project_reports:
        project_key = (
            project_report.project.latest_project_id or project_report.project.id
        )

        old_values = {
            field: getattr(project_report, field)
            for field in AnnualProjectReport.DENORM_FIELDS
        }

        project_report.project.cached_version_3_list = (
            [version_3_map[project_key]] if project_key in version_3_map else []
        )
        project_report.project.cached_versions_for_year = (
            [latest_version_map[project_key]]
            if project_key in latest_version_map
            else []
        )
        project_report.project.cached_all_versions_for_year = all_versions_map.get(
            project_key, []
        )

        project_report.populate_derived_fields()

        if any(
            getattr(project_report, field) != old_values[field]
            for field in AnnualProjectReport.DENORM_FIELDS
        ):
            to_update.append(project_report)

    if to_update:
        with transaction.atomic():
            AnnualProjectReport.objects.bulk_update(
                to_update, AnnualProjectReport.DENORM_FIELDS, batch_size=500
            )

    changed_count = len(to_update)

    # Now pull in projects that were added after the APR was first initialized
    agency_reports = AnnualAgencyProjectReport.objects.filter(
        progress_report=progress_report
    ).select_related("agency")

    added_count = 0
    for agency_report in agency_reports:
        agency = agency_report.agency

        existing_project_ids = existing_by_report_id.get(agency_report.id, set())

        projects_queryset = (
            Project.objects.filter(
                latest_project__isnull=True,
                version__gte=3,
            )
            .select_related(
                "country",
                "agency",
                "sector",
                "project_type",
                "status",
                "meeting",
                "decision",
            )
            .prefetch_related(
                "subsectors",
                "ods_odp",
                "ods_odp__ods_substance",
                "ods_odp__ods_blend",
            )
            .order_by("code")
        )
        filterset = APRProjectFilter(
            data={"year": year, "agency": agency.id},
            queryset=projects_queryset,
        )
        new_projects = [p for p in filterset.qs if p.id not in existing_project_ids]

        if not new_projects:
            continue

        previous_reports_dict = get_previous_year_project_reports(agency.id, year)
        for project in new_projects:
            # It's OK to create new projects individually, there should not be many.
            key = (project.code, agency.id)
            default_data = {"status": project.status.name}
            previous_data = previous_reports_dict.get(key, default_data)

            project_report, created = AnnualProjectReport.objects.get_or_create(
                project=project,
                report=agency_report,
                defaults=previous_data,
            )
            if created or project_report.meta_code_denorm is None:
                project_report.populate_derived_fields()
                project_report.save()
                added_count += 1

    return {
        "updated_count": len(project_reports),
        "changed_count": changed_count,
        "added_count": added_count,
        "agencies_count": agencies_count,
        "message": (
            f"Synced {len(project_reports)} project report(s) across "
            f"{agencies_count} agency/agencies; {changed_count} record(s) updated, "
            f"{added_count} new project report(s) added."
        ),
    }
