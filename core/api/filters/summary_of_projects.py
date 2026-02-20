from django_filters import rest_framework as filters
from django_filters.widgets import CSVWidget

from core.models import Agency
from core.models import Country
from core.models import Project
from core.models import ProjectCluster
from core.models import ProjectSector
from core.models import ProjectType


class NumberInFilter(filters.BaseInFilter, filters.NumberFilter):
    pass


class SummaryOfProjectsFilter(filters.FilterSet):
    """
    Filter for projects
    """

    meeting_id = filters.NumberFilter(field_name="meeting")

    submission_status = filters.CharFilter(
        field_name="submission_status__name",
        lookup_expr="iexact",
    )

    blanket_or_individual_consideration = filters.CharFilter(
        field_name="blanket_or_individual_consideration",
        lookup_expr="iexact",
    )

    cluster_id = filters.ModelMultipleChoiceFilter(
        field_name="cluster",
        queryset=ProjectCluster.objects.all(),
        widget=CSVWidget,
        help_text="Filter by cluster. Multiple values can be separated by comma.",
    )

    project_type_id = filters.ModelMultipleChoiceFilter(
        field_name="project_type",
        queryset=ProjectType.objects.all(),
        widget=CSVWidget,
        help_text="Filter by project type. Multiple values can be separated by comma.",
    )

    country_id = filters.ModelMultipleChoiceFilter(
        field_name="country",
        queryset=Country.objects.all(),
        widget=CSVWidget,
        help_text="Filter by country. Multiple values can be separated by comma.",
    )

    sector_id = filters.ModelMultipleChoiceFilter(
        field_name="sector",
        queryset=ProjectSector.objects.all(),
        widget=CSVWidget,
        help_text="Filter by sector. Multiple values can be separated by comma.",
    )

    agency_id = filters.ModelMultipleChoiceFilter(
        field_name="agency",
        queryset=Agency.objects.all(),
        widget=CSVWidget,
        help_text="Filter by agency. Multiple values can be separated by comma.",
    )

    tranche = NumberInFilter(field_name="tranche", lookup_expr="in")

    class Meta:
        model = Project
        fields = [
            "meeting_id",
            "submission_status",
            "blanket_or_individual_consideration",
            "cluster_id",
            "project_type_id",
            "country_id",
            "sector_id",
            "agency_id",
            "tranche",
        ]
