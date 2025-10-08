from django_filters import rest_framework as filters

from core.models import Project


class ProjectApprovalSummaryFilter(filters.FilterSet):
    """
    Filter for projects
    """

    meeting_id = filters.BaseInFilter(
        field_name="meeting",
        lookup_expr="in",
    )

    submission_status = filters.CharFilter(
        field_name="submission_status__name",
        lookup_expr='iexact',
    )

    individual_consideration = filters.BooleanFilter(
        field_name="individual_consideration",
    )

    class Meta:
        model = Project
        fields = [
            "meeting_id",
            "submission_status",
            "individual_consideration",
        ]
