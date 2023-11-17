from django_filters import rest_framework as filters
from django_filters.widgets import CSVWidget

from core.models import BPRecord
from core.models import BusinessPlan


class BusinessPlanFilter(filters.FilterSet):
    status = filters.MultipleChoiceFilter(
        choices=BusinessPlan.Status.choices,
        widget=CSVWidget,
    )

    class Meta:
        model = BusinessPlan
        fields = [
            "status",
            "agencies",
            "year_start",
            "year_end",
        ]


class BPRecordFilter(filters.FilterSet):
    class Meta:
        model = BPRecord
        fields = [
            "business_plan_id",
            "country_id",
            "lvc_status",
            "project_type",
            "bp_chemical_type",
            "substances",
            "blends",
            "sector_id",
            "subsector_id",
            "bp_type",
            "is_multi_year",
        ]
