import openpyxl
from django.db.models import Max
from django.db.models import Min
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from core.api.export.business_plan import BusinessPlanWriter
from core.api.filters.business_plan import BPRecordFilter
from core.api.filters.business_plan import BusinessPlanFilter
from core.api.serializers.business_plan import (
    BusinessPlanSerializer,
    BPRecordExportSerializer,
    BPRecordDetailSerializer,
)
from core.api.utils import workbook_response
from core.models import BusinessPlan, BPRecord


class BusinessPlanViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BusinessPlanSerializer
    queryset = BusinessPlan.objects.select_related("agency").order_by(
        "year_start", "year_end", "id"
    )
    filterset_class = BusinessPlanFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    ordering_fields = "__all__"
    search_fields = ["agency__name"]

    @action(methods=["GET"], detail=False, url_path="get-years")
    def get_years(self, *args, **kwargs):
        return Response(
            (
                BusinessPlan.objects.values("year_start", "year_end")
                .annotate(
                    min_year=Min("records__values__year"),
                    max_year=Max("records__values__year"),
                )
                .order_by("year_start")
            )
        )


class BPRecordViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BPRecordDetailSerializer
    queryset = (
        BPRecord.objects.select_related(
            "business_plan",
            "business_plan__agency",
            "country",
            "sector",
            "subsector",
            "project_type",
            "bp_chemical_type",
        )
        .prefetch_related(
            "substances",
            "blends",
            "values",
        )
        .order_by("country", "title", "id")
    )
    filterset_class = BPRecordFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    search_fields = ["title"]

    @action(methods=["GET"], detail=False)
    def export(self, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        limits = queryset.aggregate(
            min_year=Min("values__year"), max_year=Max("values__year")
        )
        data = BPRecordExportSerializer(queryset, many=True).data

        wb = openpyxl.Workbook()
        BusinessPlanWriter(
            wb.active,
            min_year=limits["min_year"],
            max_year=limits["max_year"],
        ).write(data)

        name = f"Business Plans {limits['min_year']}-{limits['max_year'] - 1}"
        return workbook_response(name, wb)
