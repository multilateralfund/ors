from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics

from core.api.filters.country_programme import CPPricesFilter
from core.api.serializers.cp_price import CPPricesListSerializer
from core.models.country_programme import CPPrices


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
