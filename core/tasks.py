from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404

from core.models.country_programme import CPComment, CPReport
from multilateralfund.celery import app

logger = get_task_logger(__name__)
User = get_user_model()


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

    for recipient in recipients:
        send_mail(
            f"New comment added for {cp_report.country}",
            (
                f"Hello!\n\n"
                f"A new comment was added for {cp_report.country} {cp_report.year} "
                f"in version {cp_report.version} ({comment_section}):\n"
                f"{cp_comment.comment}\n\n"
                f"Link: {link}"
            ),
            None,  # use DEFAULT_FROM_EMAIL
            [recipient.email],
            fail_silently=False,
        )


@app.task()
def send_mail_report_submit(cp_report_id):
    cp_report = get_object_or_404(CPReport, id=cp_report_id)
    link = f"{settings.FRONTEND_HOST[0]}/country-programme/{cp_report.country.iso3}/{cp_report.year}"
    recipients = User.objects.filter(user_type=User.UserType.SECRETARIAT)

    for recipient in recipients:
        send_mail(
            f"New report added for {cp_report.country}",
            (
                f"Hello!\n\n"
                f"Report version {cp_report.version} "
                f"was created for {cp_report.country} {cp_report.year}.\n"
                f"Link: {link}"
            ),
            None,  # use DEFAULT_FROM_EMAIL
            [recipient.email],
            fail_silently=False,
        )
