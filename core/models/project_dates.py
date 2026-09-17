"""
Shared "date of completion" rules for the projects inventory report and APR.

These functions are now the single source of truth. Callers can normalize the result
to whatever their own field needs (spreadsheet cell, DateField).
"""

import datetime

from django.utils import timezone

from core.models.project import MetaProject

# pylint: disable=R0911


def tz_naive(value: datetime.datetime | datetime.date | None):
    # Convert date to datetime at midnight if it's not already a datetime
    if isinstance(value, datetime.date) and not isinstance(value, datetime.datetime):
        value = datetime.datetime.combine(value, datetime.time.min)

    if isinstance(value, datetime.datetime) and timezone.is_aware(value):
        return timezone.localtime(value).replace(tzinfo=None)

    return value


def as_report_date(value):
    """tz_naive returns datetimes; the APR stores these values in DateFields."""
    return value.date() if isinstance(value, datetime.datetime) else value


def is_same_month(first, second):
    return bool(
        first and second and first.year == second.year and first.month == second.month
    )


def get_mya_completion_date(project):
    meta_project = project.meta_project

    if meta_project and meta_project.type == MetaProject.MetaProjectType.MYA:
        return tz_naive(meta_project.end_date)

    return None


def get_extended_date(project, mya_has_ongoing_project):
    """
    `mya_has_ongoing_project`: the inventory report precomputes this across the
    projects in the export (`mya_is_ongoing`), the APR resolves it per row.
    """
    if project.has_override_extended_date:
        return project.override_extended_date

    if project.status and project.status.code == "TRF":
        return None

    meta_project = project.meta_project
    if not meta_project:
        return None

    extended_date = tz_naive(meta_project.extended_date_of_completion)
    if extended_date is None:
        return None

    if not mya_has_ongoing_project:
        return None

    if is_same_month(extended_date, get_mya_completion_date(project)):
        return None

    return extended_date
