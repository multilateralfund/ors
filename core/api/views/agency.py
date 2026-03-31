from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from core.api.serializers.agency import AgencySerializer, BusinessPlanAgencySerializer
from core.models.agency import Agency


class AgencyListView(generics.ListAPIView):
    """
    List agencies
    """

    queryset = Agency.objects.all()
    serializer_class = AgencySerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    ordering_fields = [
        "name",
        "agency_type",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()
        include_all_agencies_option = (
            self.request.query_params.get(
                "include_all_agencies_option", "false"
            ).lower()
            == "true"
        )
        values_exclusive_for = self.request.query_params.get(
            "values_exclusive_for", None
        )

        if values_exclusive_for == "business_plan":
            queryset = queryset.exclude(
                name__in=[
                    "China (FECO)",
                ]
            )
        elif values_exclusive_for == "projects":
            queryset = queryset.exclude(
                name__in=[
                    "China (FECO)",
                    "Treasurer (Cash Pool)",
                    "Secretariat",
                ]
            )

        if not include_all_agencies_option:
            queryset = queryset.exclude(name="All agencies")

        return queryset.order_by("name")

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="include_all_agencies_option",
                location=OpenApiParameter.QUERY,
                description="Includes 'All Agencies' option in the response",
                type=OpenApiTypes.BOOL,
                default=False,
            ),
            OpenApiParameter(
                name="values_exclusive_for",
                location=OpenApiParameter.QUERY,
                description="Give the module for which the agencies are being requested",
                type=OpenApiTypes.STR,
                enum=["business_plan", "projects", "all"],
            ),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class BusinessPlanAgencyListView(AgencyListView):
    """
    List agencies for business plan users
    """

    serializer_class = BusinessPlanAgencySerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        queryset = queryset.exclude(
            name__in=[
                "China (FECO)",
            ]
        )

        return queryset.order_by("name")
