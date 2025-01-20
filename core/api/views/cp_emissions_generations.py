from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework import generics

from core.api.filters.country_programme import DashboardsCPBaseFilter
from core.api.serializers.cp_emission import DashboardsCPEmissionSerializer
from core.api.serializers.cp_generation import DashboardsCPGenerationSerializer
from core.api.views.utils import get_country_region_dict
from core.model_views.country_programme import AllEmissionsView, AllGenerationsView
from core.models.country_programme import CPReport
from core.models.substance import Substance


class DashboardsCPEmissionsView(generics.GenericAPIView):
    """
    This view is made for ekimetrics dashboards
    This is an API endpoint that allows to list CP Emissions
    and it will return the list of all emissions including the archive

    The queryset is a db view that is a union of the cp_emissions, cp_emissions_archive tables
    """

    queryset = AllEmissionsView.objects.filter(
        report_status=CPReport.CPReportStatus.FINAL
    ).order_by("-report_year", "country_name", "-report_version", "facility")
    filterset_class = DashboardsCPBaseFilter
    filter_backends = [
        DjangoFilterBackend,
    ]
    serializer_class = DashboardsCPEmissionSerializer

    def get(self, request, *args, **kwargs):
        all_emissions = self.filter_queryset(self.get_queryset())

        all_generations = AllGenerationsView.objects.filter(
            report_status=CPReport.CPReportStatus.FINAL
        ).order_by("-report_year", "country_name", "-report_version")
        all_generations = self.filter_queryset(all_generations)

        substance = Substance.objects.get(name="HFC-23")
        serializer_context = {
            "substance_name": substance.name,
            "substance_id": substance.id,
            "substance_gwp": substance.gwp,
            "country_region_dict": get_country_region_dict(),
        }

        final_list = (
            DashboardsCPEmissionSerializer(
                all_emissions, many=True, context=serializer_context
            ).data
            + DashboardsCPGenerationSerializer(
                all_generations, many=True, context=serializer_context
            ).data
        )
        final_list = sorted(
            final_list,
            key=lambda x: (
                -x["year"],
                x["country_name"],
                -x["version"],
                x["facility_name"],
            ),
        )

        return Response(final_list)
