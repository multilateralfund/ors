from rest_framework import generics

from core.api.permissions import HasMetaProjectsViewAccess
from core.api.serializers.funding_window import FundingWindowSerializerForCreateUpdate
from core.api.serializers.funding_window import FundingWindowSerializerForListing
from core.api.views.funding_window_export import FundingWindowExport
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


class FundingWindowExportView(generics.GenericAPIView):
    permission_classes = [HasMetaProjectsViewAccess]
    queryset = FundingWindow.objects.select_related("meeting", "decision").order_by("id")
    serializer_class = FundingWindowSerializerForListing

    def get(self, request, *args, **kwargs):
        return FundingWindowExport(self).export_xls()
