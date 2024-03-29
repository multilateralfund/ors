import math

import openpyxl
from django.db.models import Max
from django.db.models import Min
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from core.api.export.base import configure_sheet_print
from core.api.export.business_plan import BusinessPlanWriter
from core.api.filters.business_plan import BPRecordFilter
from core.api.filters.business_plan import BusinessPlanFilter
from core.api.serializers.business_plan import (
    BusinessPlanSerializer,
    BPRecordExportSerializer,
    BPRecordDetailSerializer,
)
from core.api.utils import workbook_pdf_response
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
                .order_by("-year_start")
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
    )
    filterset_class = BPRecordFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    search_fields = ["title"]
    ordering = ["title", "country", "id"]
    ordering_fields = [
        "title",
        "country__iso3",
        "country__name",
        "business_plan__agency__name",
        "project_type__code",
        "sector__code",
        "subsector__code",
        "bp_type",
        "is_multi_year",
    ]

    def get_wb(self, method):
        queryset = self.filter_queryset(self.get_queryset())
        data = BPRecordExportSerializer(queryset, many=True).data

        limits = queryset.aggregate(
            min_year=Min("values__year"), max_year=Max("values__year")
        )

        if start_year := int(self.request.query_params.get("business_plan__year_start", "0")):
            # If there is no data, or only partial data. Ensure we have fields for
            # start_year, start_year + 1, start_year + 2, after start_year + 2
            limits["min_year"] = limits["min_year"] or start_year
            limits["max_year"] = max(limits["max_year"] or -math.inf, start_year + 3)

        wb = openpyxl.Workbook()
        sheet = wb.active
        sheet.title = "Business Plans"
        configure_sheet_print(sheet, sheet.ORIENTATION_LANDSCAPE)

        BusinessPlanWriter(
            sheet,
            min_year=limits["min_year"],
            max_year=limits["max_year"],
        ).write(data)

        name = f"Business Plans {limits['min_year']}-{limits['max_year'] - 1}"
        return method(name, wb)

    @action(methods=["GET"], detail=False)
    def export(self, *args, **kwargs):
        return self.get_wb(workbook_response)

    @action(methods=["GET"], detail=False)
    def print(self, *args, **kwargs):
        return self.get_wb(workbook_pdf_response)
