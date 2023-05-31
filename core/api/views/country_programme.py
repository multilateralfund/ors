from rest_framework import mixins, generics
from core.api.filters.country_programme import (
    CountryProgrammeReportFilter,
    CountryProgrammeRecordFilter,
)

from core.api.serializers import (
    CountryProgrammeReportSerializer,
    CountryProgrammeRecordSerializer,
)
from core.models.country_programme import CountryProgrammeRecord, CountryProgrammeReport


# view for country programme reports
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


# view for country programme record list
class CountryProgrammeRecordListAPIView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows country programme records to be viewed.
    @param country_programme_id: int - query filter for country programme id (exact)
    @param name: str - query filter for name (contains)
    @param year: int - query filter for year (exact)
    """

    filterset_class = CountryProgrammeRecordFilter
    serializer_class = CountryProgrammeRecordSerializer

    def get_queryset(self):
        return (
            CountryProgrammeRecord.objects.select_related("substance", "blend")
            .prefetch_related("record_usages")
            .order_by(
                "section",
                "substance__group__name",
                "substance__name",
            )
        )

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
