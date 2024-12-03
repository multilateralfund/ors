from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics
from rest_framework.response import Response

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
    queryset = CPEmission.objects.select_related("country_programme_report")
    filterset_class = CPEmissionsFilter
    filter_backends = [
        DjangoFilterBackend,
    ]

    def get_data(self, queryset):
        final_list = []
        if not queryset:
            return final_list

        country_region_dict = get_country_region_dict()
        hfc_23 = Substance.objects.get(name="HFC-23")
        for obj in queryset:
            obj.region = country_region_dict.get(
                obj.country_programme_report.country_id
            )
            obj.substance = hfc_23
            final_list.append(obj)

        return final_list

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            return_data = self.get_data(page)
            serializer = self.get_serializer(return_data, many=True)
            return self.get_paginated_response(serializer.data)

        return_data = self.get_data(queryset)
        serializer = self.get_serializer(return_data, many=True)
        return Response(serializer.data)
