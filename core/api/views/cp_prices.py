from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics
from rest_framework.response import Response

from core.api.filters.country_programme import DashboardsCPPricesFilter, CPPricesFilter
from core.api.serializers.cp_price import (
    DashboardsCPPricesSerializer,
    CPPricesListSerializer,
)
from core.model_views.country_programme import AllPricesView
from core.models.country_programme import CPPrices, CPReport
from core.models.group import Group


class CPPricesView(generics.ListAPIView):
    """
    API endpoint that allows to list CP Prices
    for a specific country and a specific year
    """

    serializer_class = CPPricesListSerializer
    queryset = CPPrices.objects.select_related(
        "country_programme_report__country", "substance__group", "blend"
    )
    filterset_class = CPPricesFilter
    filter_backends = [
        DjangoFilterBackend,
    ]

    @swagger_auto_schema(
        operation_description="Get CP Prices for a specific country and a specific year"
        "This endpoint will only return the prices that are not archived (from the latest version)",
    )
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)


class DashboardsCPPricesView(generics.ListAPIView):
    """
    This view is made for ekimetrics dashboards
    This is an API endpoint that allows to list CP Prices
    and it will return the list of all prices including the archive

    The queryset is a db view that is a union of the cp_prices, cp_prices_archive tables

    """

    serializer_class = DashboardsCPPricesSerializer
    queryset = AllPricesView.objects.filter(
        report_status=CPReport.CPReportStatus.FINAL
    ).order_by(
        "-report_year",
        "country_name",
        "-report_version",
        "substance_name",
        "blend_name",
    )
    filterset_class = DashboardsCPPricesFilter
    filter_backends = [
        DjangoFilterBackend,
    ]

    @swagger_auto_schema(
        operation_description="Get all CP Prices including the archive data",
    )
    def get(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer_context = self.get_serializer_context()
        serializer_context["annex_f"] = Group.objects.get(name="F")

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(
                page, many=True, context=serializer_context
            )
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(
            queryset, many=True, context=serializer_context
        )
        return Response(serializer.data)
