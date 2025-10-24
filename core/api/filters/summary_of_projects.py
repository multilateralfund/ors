from django_filters import rest_framework as filters

from core.models import Project


class SummaryOfProjectsFilter(filters.FilterSet):
    """
    Filter for projects
    """

    meeting_id = filters.BaseInFilter(
        field_name="meeting",
        lookup_expr="in",
    )

    submission_status = filters.CharFilter(
        field_name="submission_status__name",
        lookup_expr="iexact",
    )

    individual_consideration = filters.BooleanFilter(
        field_name="individual_consideration",
    )

    cluster_id = filters.BaseInFilter(
        field_name="cluster",
        lookup_expr="in",
    )

    project_type_id = filters.BaseInFilter(
        field_name="project_type",
        lookup_expr="in",
    )

    country_id = filters.BaseInFilter(
        field_name="country",
        lookup_expr="in",
    )

    sector_id = filters.BaseInFilter(
        field_name="sector",
        lookup_expr="in",
    )

    agency_id = filters.BaseInFilter(
        field_name="agency",
        lookup_expr="in",
    )

    tranche = filters.NumberFilter()

    class Meta:
        model = Project
        fields = [
            "meeting_id",
            "submission_status",
            "individual_consideration",
            "cluster_id",
            "project_type_id",
            "country_id",
            "sector_id",
            "agency_id",
            "tranche",
        ]
