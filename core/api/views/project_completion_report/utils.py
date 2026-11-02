from django.db.models import Exists, OuterRef, Q

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
            queryset = queryset.exclude(status=PCR.Status.SUBMITTED)

    return queryset
