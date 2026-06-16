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

    submission_status = filters.CharFilter(method="filter_submission_status")

    blanket_or_individual_consideration = filters.CharFilter(
        field_name="blanket_or_individual_consideration",
        lookup_expr="iexact",
    )

    class Meta:
        model = Project
        fields = [
            "meeting_id",
            "submission_status",
            "blanket_or_individual_consideration",
        ]

    def filter_submission_status(self, queryset, _, value):
        if not value:
            return queryset

        queryset = queryset.filter(submission_status__name__iexact=value)

        if value.lower() == "approved":
            queryset = queryset.filter(version=3)

        elif value.lower() == "recommended":
            queryset = queryset.filter(version=2)

        return queryset
