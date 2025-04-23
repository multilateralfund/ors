from django_filters import rest_framework as filters
from django_filters.fields import CSVWidget

from core.models.agency import Agency
from core.models.country import Country
from core.models.meeting import Meeting
from core.models.project import (
    MetaProject,
    Project,
    ProjectCluster,
    ProjectSector,
    ProjectStatus,
    ProjectSubmissionStatus,
    ProjectSubSector,
    ProjectType,
)
from core.models.utils import SubstancesType


class MetaProjectFilter(filters.FilterSet):
    """
    Filter for meta projects
    """

    class Meta:
        model = MetaProject
        fields = ["code", "type"]


class ProjectFilter(filters.FilterSet):
    """
    Filter for projects
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
    submission_status_id = filters.ModelMultipleChoiceFilter(
        field_name="submission_status",
        queryset=ProjectSubmissionStatus.objects.all(),
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
    meeting_id = filters.ModelMultipleChoiceFilter(
        field_name="meeting",
        queryset=Meeting.objects.all(),
        widget=CSVWidget,
    )
    cluster_id = filters.ModelMultipleChoiceFilter(
        field_name="cluster",
        queryset=ProjectCluster.objects.all(),
        widget=CSVWidget,
    )
    date_received = filters.DateFromToRangeFilter(field_name="date_received")

    class Meta:
        model = Project
        fields = [
            "country_id",
            "status_id",
            "submission_status_id",
            "sector_id",
            "subsector_id",
            "project_type_id",
            "substance_type",
            "agency_id",
            "cluster_id",
            "meeting_id",
            "date_received",
        ]
