from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404

from core.models.business_plan import BusinessPlan
from core.models.country_programme import CPComment, CPReport
from multilateralfund.celery import app

logger = get_task_logger(__name__)
User = get_user_model()


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
            user_type=User.UserType.COUNTRY_USER, country=cp_report.country
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
def send_mail_comment_submit_bp(business_plan_id, comment_type):
    business_plan = get_object_or_404(BusinessPlan, id=business_plan_id)
    link = (
        f"{settings.FRONTEND_HOST[0]}/business-plans/{business_plan.agency.name}/"
        f"{business_plan.year_start}/{business_plan.year_end}"
    )

    if comment_type == "comment_agency":
        recipients = User.objects.filter(user_type=User.UserType.SECRETARIAT)
    else:
        # TODO filter by agency
        recipients = User.objects.filter(user_type=User.UserType.AGENCY)

    send_mail(
        "MLF Knowledge Management System: New comment added for Business Plan",
        (
            f"This is an automated message informing you that a new "
            f"comment was added for the Business Plan of agency: {business_plan.agency} "
            f"and years: {business_plan.year_start} - {business_plan.year_end}.\n\n"
            f"The Business Plan is available at {link}"
        ),
        None,  # use DEFAULT_FROM_EMAIL
        recipients.values_list("email", flat=True),
        fail_silently=False,
    )


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
