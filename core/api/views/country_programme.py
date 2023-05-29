from rest_framework import mixins, generics
from core.api.filters.country_programme import CountryProgrammeReportFilter

from core.api.serializers import CountryProgrammeReportSerializer
from core.models.country_programme import CountryProgrammeReport


# view for country programme records
class CountryProgrammeReportListAPIView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows country programmes to be viewed.
    @param country_id: int - query filter for country id (exact)
    @param name: str - query filter for name (contains)
    @param year: int - query filter for year (exact)
    """

    queryset = CountryProgrammeReport.objects.select_related("country").order_by("name")
    filterset_class = CountryProgrammeReportFilter
    serializer_class = CountryProgrammeReportSerializer

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
