from rest_framework import generics
from core.api.permissions import HasMetaProjectsViewAccess
from core.api.serializers.funding_window import FundingWindowSerializer
from core.models.funding_window import FundingWindow


class FundingWindowListCreateView(generics.ListCreateAPIView):
    """
    List and create funding windows.
    """

    permission_classes = [HasMetaProjectsViewAccess]
    queryset = FundingWindow.objects.all()
    serializer_class = FundingWindowSerializer
