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
from core.models.project_enterprise import Enterprise, ProjectEnterprise
from core.models.project_metadata import (
    ProjectCluster,
    ProjectSector,
    ProjectStatus,
    ProjectSubmissionStatus,
    ProjectSubSector,
    ProjectType,
)
from core.models.utils import SubstancesType, EnterpriseStatus


class ProjectFilterBackend(DjangoFilterBackend):
    def get_filterset_class(self, view, queryset=None):
        return ProjectFilter


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
    subsectors = filters.ModelMultipleChoiceFilter(
        field_name="subsectors",
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
    blanket_or_individual_consideration = filters.MultipleChoiceFilter(
        field_name="blanket_or_individual_consideration",
        choices=[
            ("individual", True),
            ("blanket", False),
            ("N/A", None),
        ],
        widget=CSVWidget,
        method="filter_blanket_or_individual_consideration",
    )
    date_received = filters.DateFromToRangeFilter(field_name="date_received")
    meta_project__isnull = filters.BooleanFilter(
        field_name="meta_project",
        lookup_expr="isnull",
    )

    def filter_blanket_or_individual_consideration(self, queryset, name, value):
        if not value:
            return queryset
        query_filters = Q()
        for option in value:
            if option.lower() == "individual":
                query_filters |= Q(**{name: "individual"})
            elif option.lower() == "blanket":
                query_filters |= Q(**{name: "blanket"})
            elif option.lower() == "n/a":
                query_filters |= Q(**{f"{name}__isnull": True})
        if not query_filters:
            return queryset
        return queryset.filter(query_filters)

    class Meta:
        model = Project
        fields = [
            "country_id",
            "status_id",
            "submission_status_id",
            "sector_id",
            "subsectors",
            "project_type_id",
            "substance_type",
            "agency_id",
            "cluster_id",
            "meeting_id",
            "date_received",
        ]


class ProjectEnterpriseFilter(filters.FilterSet):
    """
    Filter for project enterprises
    """

    project_id = filters.ModelMultipleChoiceFilter(
        field_name="project",
        queryset=Project.objects.all(),
        widget=CSVWidget,
    )
    enterprise_id = filters.ModelMultipleChoiceFilter(
        field_name="enterprise",
        queryset=Enterprise.objects.all(),
        widget=CSVWidget,
    )
    country_id = filters.ModelMultipleChoiceFilter(
        field_name="enterprise__country",
        queryset=Country.objects.all(),
        widget=CSVWidget,
    )
    status = filters.MultipleChoiceFilter(
        choices=EnterpriseStatus.choices,
        widget=CSVWidget,
    )

    class Meta:
        model = ProjectEnterprise
        fields = [
            "project_id",
            "country_id",
            "status",
        ]


class EnterpriseFilter(filters.FilterSet):
    """
    Filter for enterprises
    """

    country_id = filters.ModelMultipleChoiceFilter(
        field_name="country",
        queryset=Country.objects.all(),
        widget=CSVWidget,
    )
    status = filters.MultipleChoiceFilter(
        choices=EnterpriseStatus.choices,
        widget=CSVWidget,
    )
    agencies = filters.ModelMultipleChoiceFilter(
        field_name="agencies",
        queryset=Agency.objects.all(),
        widget=CSVWidget,
    )

    class Meta:
        model = Enterprise
        fields = [
            "country_id",
            "status",
            "agencies",
        ]
