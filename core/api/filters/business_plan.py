from django_filters import rest_framework as filters
from django_filters.widgets import CSVWidget
from django_filters.rest_framework import DjangoFilterBackend

from core.models import BPActivity
from core.models import BusinessPlan
from core.models import Country
from core.models import ProjectCluster
from core.models import ProjectSector
from core.models import ProjectSubSector
from core.models import ProjectType
from core.models.agency import Agency
from core.models.business_plan import BPChemicalType


class BPFilterBackend(DjangoFilterBackend):
    def get_filterset_class(self, view, queryset=None):
        if getattr(view, "action", None) == "get":
            return BPActivityFilter
        return BusinessPlanFilter


class BusinessPlanFilter(filters.FilterSet):
    status = filters.MultipleChoiceFilter(
        choices=BusinessPlan.Status.choices,
        widget=CSVWidget,
    )
    agency_id = filters.ModelMultipleChoiceFilter(
        field_name="agency_id",
        queryset=Agency.objects.all(),
        widget=CSVWidget,
    )

    class Meta:
        model = BusinessPlan
        fields = [
            "status",
            "agency_id",
            "year_start",
            "year_end",
            "is_latest",
        ]


class BPActivityFilter(filters.FilterSet):
    country_id = filters.ModelMultipleChoiceFilter(
        queryset=Country.objects.all(),
        widget=CSVWidget,
        help_text="Filter by country. Multiple values can be separated by comma.",
    )
    sector_id = filters.ModelMultipleChoiceFilter(
        queryset=ProjectSector.objects.all(),
        widget=CSVWidget,
        help_text="Filter by sector. Multiple values can be separated by comma.",
    )
    subsector_id = filters.ModelMultipleChoiceFilter(
        queryset=ProjectSubSector.objects.all(),
        widget=CSVWidget,
        help_text="Filter by subsector. Multiple values can be separated by comma.",
    )
    project_type_id = filters.ModelMultipleChoiceFilter(
        queryset=ProjectType.objects.all(),
        widget=CSVWidget,
        help_text="Filter by project type. Multiple values can be separated by comma.",
    )
    project_cluster_id = filters.ModelMultipleChoiceFilter(
        queryset=ProjectCluster.objects.all(),
        widget=CSVWidget,
        help_text="Filter by project cluster. Multiple values can be separated by comma.",
    )
    status = filters.MultipleChoiceFilter(
        choices=BPActivity.Status.choices,
        widget=CSVWidget,
        help_text="Filter by status. Multiple values can be separated by comma.",
    )
    bp_chemical_type_id = filters.MultipleChoiceFilter(
        choices=BPChemicalType.objects.all(),
        widget=CSVWidget,
        help_text="Filter by BP chemical type. Multiple values can be separated by comma.",
    )

    class Meta:
        model = BPActivity
        fields = [
            "country_id",
            "project_type_id",
            "project_cluster_id",
            "bp_chemical_type_id",
            "sector_id",
            "subsector_id",
            "status",
            "is_multi_year",
            "comment_types",
        ]


class BPActivityListFilter(BPActivityFilter):
    year_start = filters.NumberFilter(
        field_name="business_plan__year_start", lookup_expr="gte", required=True
    )
    year_end = filters.NumberFilter(
        field_name="business_plan__year_end", lookup_expr="lte", required=True
    )
    agency_id = filters.ModelMultipleChoiceFilter(
        field_name="business_plan__agency_id",
        queryset=Agency.objects.all(),
        widget=CSVWidget,
    )

    class Meta(BPActivityFilter.Meta):
        fields = BPActivityFilter.Meta.fields + ["year_start", "year_end", "agency_id"]
