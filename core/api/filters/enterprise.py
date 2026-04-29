from django.db.models import Q
from django_filters import rest_framework as filters
from django_filters.fields import CSVWidget
from django_filters.rest_framework import DjangoFilterBackend

from core.models.agency import Agency
from core.models.country import Country
from core.models.meeting import Meeting
from core.models.project import (
    MetaProject,
    Project,
)
from core.models.enterprise import Enterprise, EnterpriseStatus
from core.models.project_metadata import (
    ProjectCluster,
    ProjectSector,
    ProjectStatus,
    ProjectSubmissionStatus,
    ProjectSubSector,
    ProjectType,
)
from core.models.utils import SubstancesType


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

    class Meta:
        model = Enterprise
        fields = [
            "country_id",
            "agency_id",
            "meeting_id",
        ]
