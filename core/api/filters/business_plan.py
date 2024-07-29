from django_filters import rest_framework as filters
from django_filters.widgets import CSVWidget

from core.models import BPRecord
from core.models import BusinessPlan
from core.models import Country
from core.models import ProjectCluster
from core.models import ProjectSector
from core.models import ProjectSubSector
from core.models import ProjectType
from core.models.agency import Agency


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
        ]


class BPRecordFilter(filters.FilterSet):
    country_id = filters.ModelMultipleChoiceFilter(
        queryset=Country.objects.all(),
        widget=CSVWidget,
    )
    sector_id = filters.ModelMultipleChoiceFilter(
        queryset=ProjectSector.objects.all(),
        widget=CSVWidget,
    )
    subsector_id = filters.ModelMultipleChoiceFilter(
        queryset=ProjectSubSector.objects.all(),
        widget=CSVWidget,
    )
    project_type_id = filters.ModelMultipleChoiceFilter(
        queryset=ProjectType.objects.all(),
        widget=CSVWidget,
    )
    project_cluster_id = filters.ModelMultipleChoiceFilter(
        queryset=ProjectCluster.objects.all(),
        widget=CSVWidget,
    )
    status = filters.MultipleChoiceFilter(
        choices=BPRecord.Status.choices,
        widget=CSVWidget,
    )

    class Meta:
        model = BPRecord
        fields = [
            "country_id",
            "lvc_status",
            "project_type_id",
            "project_cluster_id",
            "bp_chemical_type",
            "substances",
            "sector_id",
            "subsector_id",
            "status",
            "is_multi_year",
        ]


class BPRecordListFilter(BPRecordFilter):
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

    class Meta(BPRecordFilter.Meta):
        fields = BPRecordFilter.Meta.fields + ["year_start", "year_end", "agency_id"]
