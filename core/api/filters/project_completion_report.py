from django.db.models import Q
from django_filters import rest_framework as filters
from django_filters.fields import CSVWidget

from core.models.agency import Agency
from core.models.country import Country
from core.models.project import Project
from core.models.project_completion_report import PCRProject
from core.models.project_metadata import (
    ProjectCluster,
    ProjectSector,
    ProjectSubSector,
    ProjectType,
)
from core.api.filters.project import project_has_cooperating_agency_q


class PCRProjectFilter(filters.FilterSet):
    region_id = filters.ModelMultipleChoiceFilter(
        queryset=Country.objects.filter(location_type=Country.LocationType.REGION),
        widget=CSVWidget,
        method="filter_region",
    )
    country_id = filters.ModelMultipleChoiceFilter(
        field_name="project__country",
        queryset=Country.objects.all(),
        widget=CSVWidget,
    )
    lead_agency_id = filters.ModelMultipleChoiceFilter(
        field_name="project__lead_agency",
        queryset=Agency.objects.all(),
        widget=CSVWidget,
    )
    cooperating_agency_id = filters.ModelMultipleChoiceFilter(
        queryset=Agency.objects.all(),
        widget=CSVWidget,
        method="filter_cooperating_agency",
    )
    cluster_id = filters.ModelMultipleChoiceFilter(
        field_name="project__cluster",
        queryset=ProjectCluster.objects.all(),
        widget=CSVWidget,
    )
    project_type_id = filters.ModelMultipleChoiceFilter(
        field_name="project__project_type",
        queryset=ProjectType.objects.all(),
        widget=CSVWidget,
    )
    sector_id = filters.ModelMultipleChoiceFilter(
        field_name="project__sector",
        queryset=ProjectSector.objects.all(),
        widget=CSVWidget,
    )
    subsector_id = filters.ModelMultipleChoiceFilter(
        field_name="project__subsectors",
        queryset=ProjectSubSector.objects.all(),
        widget=CSVWidget,
        distinct=True,
    )
    category = filters.MultipleChoiceFilter(
        field_name="project__category",
        choices=Project.Category.choices,
        widget=CSVWidget,
    )
    pcr_due = filters.CharFilter(method="filter_pcr_due")
    submission_date = filters.DateFromToRangeFilter(field_name="date_created")

    def filter_region(self, queryset, _name, value):
        if not value:
            return queryset

        region_ids = [region.id for region in value]
        return queryset.filter(
            Q(project__country_id__in=region_ids)
            | Q(project__country__parent_id__in=region_ids)
            | Q(project__country__parent__parent_id__in=region_ids)
        )

    def filter_pcr_due(self, queryset, _name, value):
        if value in (None, ""):
            return queryset

        values = {item.strip().lower() for item in str(value).split(",") if item}
        include_true = bool(values & {"true", "1", "yes", "y"})
        include_false = bool(values & {"false", "0", "no", "n"})

        if include_true == include_false:
            return queryset
        return queryset.filter(pcr_due_value=include_true)

    def filter_cooperating_agency(self, queryset, _name, value):
        if not value:
            return queryset

        agency_ids = [agency.id for agency in value]
        return queryset.filter(
            project_has_cooperating_agency_q(prefix="project"),
            project__agency_id__in=agency_ids,
        )

    class Meta:
        model = PCRProject
        fields = [
            "region_id",
            "country_id",
            "lead_agency_id",
            "cooperating_agency_id",
            "cluster_id",
            "project_type_id",
            "sector_id",
            "subsector_id",
            "category",
            "pcr_due",
            "submission_date",
        ]
