from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics

from core.api.filters.country_programme import CPEmissionsFilter
from core.api.serializers.cp_emission import (
    AllCPEmissionSerializer,
)
from core.api.views.utils import get_country_region_dict
from core.model_views.country_programme import AllEmissionsView
from core.models.substance import Substance


class CPAllEmissionsView(generics.ListAPIView):
    """
    This view is made for ekimetrics dashboards
    This is an API endpoint that allows to list CP Emissions
    and it will return the list of all emissions including the archive

    The queryset is a db view that is a union of the cp_emissions, cp_emissions_archive tables
    """

    serializer_class = AllCPEmissionSerializer
    queryset = AllEmissionsView.objects.order_by(
        "-report_year", "country_name", "-report_version", "facility"
    )
    filterset_class = CPEmissionsFilter
    filter_backends = [
        DjangoFilterBackend,
    ]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        substance = Substance.objects.get(name="HFC-23")
        ctx["substance_name"] = substance.name
        ctx["substance_id"] = substance.id
        ctx["substance_gwp"] = substance.gwp
        ctx["country_region_dict"] = get_country_region_dict()

        return ctx
