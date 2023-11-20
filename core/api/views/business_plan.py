from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters

from core.api.filters.business_plan import BPRecordFilter
from core.api.filters.business_plan import BusinessPlanFilter
from core.api.serializers.business_plan import (
    BusinessPlanSerializer,
    BPRecordSerializer,
)
from core.models import BusinessPlan, BPRecord


class BusinessPlanViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BusinessPlanSerializer
    queryset = BusinessPlan.objects.prefetch_related("agencies").order_by(
        "year_start", "year_end", "id"
    )
    filterset_class = BusinessPlanFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    ordering_fields = "__all__"
    search_fields = ["agencies__name"]


class BPRecordViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BPRecordSerializer
    queryset = BPRecord.objects.prefetch_related(
        "country",
        "sector",
        "subsector",
        "substances",
        "blends",
        "values",
        "project_type",
        "bp_chemical_type",
    ).order_by("country", "title", "id")
    filterset_class = BPRecordFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    search_fields = ["title"]
