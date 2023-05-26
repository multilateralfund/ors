from rest_framework import mixins, generics

from core.api.serializers import CountryProgrammeReportSerializer
from core.models.country_programme import CountryProgrammeReport


# view for country programme records
class CountryProgrammeReportListAPIView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows country programmes to be viewed.
    """

    serializer_class = CountryProgrammeReportSerializer
    queryset = CountryProgrammeReport.objects.order_by("name").select_related("country")

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
