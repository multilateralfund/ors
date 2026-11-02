from django.db.models import Q


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
