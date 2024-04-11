from rest_framework import generics

from core.api.filters.country_programme import CPFileFilter
from core.api.serializers.cp_file import CPFileSerializer
from core.models.country_programme import CPFile


class CPFilesView(generics.ListAPIView):
    """
    API endpoint that allows to list CP Files
    for a specific country and a specific year
    """

    queryset = CPFile.objects.select_related("country_programme_report")
    serializer_class = CPFileSerializer
    filterset_class = CPFileFilter
