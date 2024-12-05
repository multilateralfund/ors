from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics

from core.api.filters.country_programme import CPEmissionsFilter
from core.api.serializers.cp_emission import (
    CPEmissionListSerializer,
)
from core.api.views.utils import get_country_region_dict
from core.models.country_programme import CPEmission
from core.models.substance import Substance


class CPEmissionsView(generics.ListAPIView):
    """
    API endpoint that allows to list CP Emissions
    for a specific country and a specific year
    """

    serializer_class = CPEmissionListSerializer
    queryset = CPEmission.objects.select_related("country_programme_report__country")
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
