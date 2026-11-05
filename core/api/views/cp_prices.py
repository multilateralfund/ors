from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import generics, serializers
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

    @extend_schema(
        description="Get CP Prices for a specific country and a specific year"
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

    VALUES_FIELDS = [
        "country_id",
        "country_name",
        "report_version",
        "report_created_at",
        "report_year",
        "report_status",
        "substance_id",
        "substance_name",
        "substance_group_id",
        "substance_group_name",
        "blend_id",
        "blend_name",
        "current_year_price",
        "is_retail",
        "is_fob",
    ]

    @staticmethod
    def _serialize_rows(rows, annex_f):
        """
        Same output as DashboardsCPPricesSerializer, built from plain dicts.
        The unfiltered response has tens of thousands of rows, and model
        instances + SerializerMethodFields make the serializer too slow.
        """
        to_datetime = serializers.DateTimeField().to_representation
        return [
            {
                "country_id": row["country_id"],
                "country_name": row["country_name"],
                "version": int(row["report_version"]),
                "created_at": to_datetime(row["report_created_at"]),
                "year": row["report_year"],
                "report_status": row["report_status"],
                "group": (
                    annex_f.name_alt if row["blend_id"] else row["substance_group_name"]
                ),
                "group_id": (
                    annex_f.id if row["blend_id"] else row["substance_group_id"]
                ),
                "chemical_id": row["blend_id"] or row["substance_id"],
                "chemical_name": row["blend_name"] or row["substance_name"],
                "is_blend": bool(row["blend_id"]),
                "current_year_price": row["current_year_price"],
                "is_retail": row["is_retail"],
                "is_fob": row["is_fob"],
            }
            for row in rows
        ]

    @extend_schema(
        description="Get all CP Prices including the archive data",
    )
    def get(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset()).values(*self.VALUES_FIELDS)
        annex_f = Group.objects.get(name="F")

        page = self.paginate_queryset(queryset)
        if page is not None:
            return self.get_paginated_response(self._serialize_rows(page, annex_f))

        return Response(self._serialize_rows(queryset, annex_f))
