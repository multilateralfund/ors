from rest_framework import generics

from core.api.serializers.agency import AgencySerializer
from core.models.agency import Agency


class AgencyListView(generics.ListAPIView):
    """
    List agencies
    """

    queryset = Agency.objects.all()
    serializer_class = AgencySerializer
