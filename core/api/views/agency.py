from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics

from core.api.serializers.agency import AgencySerializer, BusinessPlanAgencySerializer
from core.models.agency import Agency


class AgencyListView(generics.ListAPIView):
    """
    List agencies
    """

    queryset = Agency.objects.all()
    serializer_class = AgencySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        include_all_agencies_option = (
            self.request.query_params.get(
                "include_all_agencies_option", "false"
            ).lower()
            == "true"
        )

        if not include_all_agencies_option:
            queryset = queryset.exclude(name="All agencies")
        return queryset

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "include_all_agencies_option",
                openapi.IN_QUERY,
                description="Includes 'All Agencies' option in the response",
                type=openapi.TYPE_BOOLEAN,
                default=False,
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
