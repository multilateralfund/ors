from rest_framework import generics
from core.api.permissions import HasMetaProjectsViewAccess
from core.api.serializers.funding_window import FundingWindowSerializerForCreateUpdate
from core.api.serializers.funding_window import FundingWindowSerializerForListing
from core.models.funding_window import FundingWindow


class FundingWindowListCreateView(generics.ListCreateAPIView):
    """
    List and create funding windows.
    """

    permission_classes = [HasMetaProjectsViewAccess]
    queryset = FundingWindow.objects.all().order_by("id")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return FundingWindowSerializerForCreateUpdate
        return FundingWindowSerializerForListing


class FundingWindowUpdateView(generics.RetrieveAPIView, generics.UpdateAPIView):
    permission_classes = [HasMetaProjectsViewAccess]
    queryset = FundingWindow.objects.all()
    serializer_class = FundingWindowSerializerForCreateUpdate
    lookup_field = "id"
