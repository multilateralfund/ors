from django_filters import rest_framework as filters
from django_filters.fields import CSVWidget

from core.models import (
    Agency,
    Country,
    Meeting,
    Enterprise,
    EnterpriseStatus,
    ProjectSector,
    ProjectSubSector,
    ProjectType,
)


class EnterpriseFilter(filters.FilterSet):
    """
    Filter for enterprises
    """

    country_id = filters.ModelMultipleChoiceFilter(
        field_name="country",
        queryset=Country.objects.all(),
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
    status_id = filters.ModelMultipleChoiceFilter(
        field_name="status",
        queryset=EnterpriseStatus.objects.all(),
        widget=CSVWidget,
    )
    sector_id = filters.ModelMultipleChoiceFilter(
        field_name="sector",
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

    class Meta:
        model = Enterprise
        fields = [
            "country_id",
            "agency_id",
            "meeting_id",
            "status_id",
            "sector_id",
            "subsector_id",
            "project_type_id",
        ]
