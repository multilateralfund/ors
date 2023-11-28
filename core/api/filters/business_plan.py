from django_filters import rest_framework as filters
from django_filters.widgets import CSVWidget

from core.models import BPRecord
from core.models import BusinessPlan
from core.models import Country
from core.models import ProjectSector
from core.models import ProjectSubSector
from core.models import ProjectType


class BusinessPlanFilter(filters.FilterSet):
    status = filters.MultipleChoiceFilter(
        choices=BusinessPlan.Status.choices,
        widget=CSVWidget,
    )

    class Meta:
        model = BusinessPlan
        fields = [
            "status",
            "agency",
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

    class Meta:
        model = BPRecord
        fields = [
            "business_plan_id",
            "business_plan__agency_id",
            "business_plan__year_start",
            "business_plan__year_end",
            "country_id",
            "lvc_status",
            "project_type_id",
            "bp_chemical_type",
            "substances",
            "blends",
            "sector_id",
            "subsector_id",
            "bp_type",
            "is_multi_year",
        ]
