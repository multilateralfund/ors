from django.db.models import Exists, OuterRef, Q
from django.db.models.functions import Coalesce
from django.utils import timezone

from core.models.meeting import Meeting
from core.models.project import MetaProject, Project
from core.models.project_completion_report import PCR


def filter_pcr_projects_permissions(user, queryset, prefix=""):
    """
    Filter a queryset of projects (or of objects related to a project, using
    `prefix`, e.g. "project__") to the projects the user can access in the PCR module.
    """
    if user.is_superuser:
        return queryset

    if user.has_perm("core.is_mlfs_user"):
        queryset = queryset.exclude(**{f"{prefix}submission_status__name": "Draft"})

    if not user.has_perm("core.can_view_production_projects"):
        queryset = queryset.filter(**{f"{prefix}production": False})

    if user.has_perm("core.can_view_all_agencies"):
        return queryset
    if user.has_perm("core.can_view_only_own_agency"):
        return queryset.filter(
            Q(**{f"{prefix}agency": user.agency})
            | (
                Q(**{f"{prefix}lead_agency": user.agency})
                & Q(**{f"{prefix}lead_agency__isnull": False})
            )
        )

    return queryset.none()


def get_pcr_accessible_meta_projects(user):
    """
    The meta projects with at least one project the user can access in the PCR module.
    """
    if user.is_superuser:
        return MetaProject.objects.all()
    projects = filter_pcr_projects_permissions(user, Project.objects.all())
    return MetaProject.objects.filter(
        Exists(projects.filter(meta_project=OuterRef("pk")))
    )


def filter_pcr_permissions(user, queryset, results_for_edit=False):
    """
    Filter a PCR queryset to the PCRs of the meta projects the user can access.
    For edit, the PCRs submitted to MLFS are locked for the agencies.
    """
    if user.is_superuser:
        return queryset

    queryset = queryset.filter(meta_project__in=get_pcr_accessible_meta_projects(user))

    if results_for_edit:
        if not user.has_perm("core.has_pcr_edit_access"):
            return queryset.none()
        if not user.has_perm("core.has_pcr_edit_submitted_access"):
            queryset = queryset.exclude(status=PCR.Status.REVISION)

    return queryset


def get_latest_meeting_approval_period():
    """
    The period in which approved PCRs count as finalized in the most recent meeting:
    after the end of the previous meeting, up to the end of the most recent one
    (the latest meeting that already started).
    Returns (start, end), where `start` is exclusive and None if there is no previous
    meeting, or None if there is no meeting yet.
    """
    meetings = list(
        Meeting.objects.exclude(status=Meeting.MeetingStatus.CANCELLED)
        .filter(date__isnull=False, date__lte=timezone.now().date())
        .annotate(last_day=Coalesce("end_date", "date"))
        .order_by("-date")
        .values_list("last_day", flat=True)[:2]
    )
    if not meetings:
        return None
    start = meetings[1] if len(meetings) > 1 else None
    return start, meetings[0]
