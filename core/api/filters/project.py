from django_filters import rest_framework as filters
from django_filters.fields import CSVWidget
from core.api.utils import SUBMISSION_STATUSE_CODES

from core.models.agency import Agency
from core.models.country import Country
from core.models.meeting import Meeting
from core.models.project import (
    Project,
    ProjectCluster,
    ProjectSector,
    ProjectStatus,
    ProjectSubSector,
    ProjectType,
)
from core.models.utils import SubstancesType


class ProjectFilter(filters.FilterSet):
    """
    Filter for country programme reports
    """

    country_id = filters.ModelMultipleChoiceFilter(
        field_name="country",
        queryset=Country.objects.all(),
        widget=CSVWidget,
    )
    status_id = filters.ModelMultipleChoiceFilter(
        field_name="status",
        queryset=ProjectStatus.objects.all(),
        widget=CSVWidget,
    )
    sector_id = filters.ModelMultipleChoiceFilter(
        field_name="sector_id",
        queryset=ProjectSector.objects.all(),
        widget=CSVWidget,
    )
    subsector_id = filters.ModelMultipleChoiceFilter(
        field_name="subsector",
        queryset=ProjectSubSector.objects.all(),
        widget=CSVWidget,
    )
    project_type_id = filters.ModelMultipleChoiceFilter(
        field_name="project_type",
        queryset=ProjectType.objects.all(),
        widget=CSVWidget,
    )
    substance_type = filters.MultipleChoiceFilter(
        choices=SubstancesType.choices,
        widget=CSVWidget,
    )
    agency_id = filters.ModelMultipleChoiceFilter(
        field_name="agency",
        queryset=Agency.objects.all(),
        widget=CSVWidget,
    )
    approval_meeting_id = filters.ModelMultipleChoiceFilter(
        field_name="approval_meeting",
        queryset=Meeting.objects.all(),
        widget=CSVWidget,
    )
    cluster_id = filters.ModelMultipleChoiceFilter(
        field_name="cluster",
        queryset=ProjectCluster.objects.all(),
        widget=CSVWidget,
    )
    date_received = filters.DateFromToRangeFilter(field_name="date_received")
    get_submission = filters.BooleanFilter(method="filter_submission")

    class Meta:
        model = Project
        fields = [
            "country_id",
            "status_id",
            "sector_id",
            "subsector_id",
            "project_type_id",
            "substance_type",
            "agency_id",
            "cluster_id",
            "approval_meeting_id",
            "date_received",
        ]

    def filter_submission(self, queryset, _name, value):
        if value:
            return queryset.filter(status__code__in=SUBMISSION_STATUSE_CODES)
        return queryset.exclude(status__code__in=SUBMISSION_STATUSE_CODES)
