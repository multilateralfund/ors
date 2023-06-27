from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import mixins, generics, views
from rest_framework.response import Response

from core.api.filters.country_programme import (
    CPReportFilter,
    CPRecordFilter,
)
from core.api.serializers import (
    CPReportSerializer,
    CPRecordSerializer,
)
from core.models.country_programme import CPRecord, CPReport


# view for country programme reports
class CPReportListView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows country programmes to be viewed.
    @param country_id: int - query filter for country id (exact)
    @param name: str - query filter for name (contains)
    @param year: int - query filter for year (exact)
    """

    queryset = CPReport.objects.select_related("country").order_by("name")
    filterset_class = CPReportFilter
    serializer_class = CPReportSerializer

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)


# view for country programme record list
class CPRecordListView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows country programme records to be viewed.
    @param country_programme_id: int - query filter for country programme id (exact)
    @param name: str - query filter for name (contains)
    @param year: int - query filter for year (exact)
    """

    filterset_class = CPRecordFilter
    serializer_class = CPRecordSerializer

    def get_queryset(self):
        return (
            CPRecord.objects.select_related("substance", "blend")
            .prefetch_related("record_usages")
            .order_by(
                "section",
                "substance__group__name",
                "substance__name",
            )
        )

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)


# view for country programme settings
class CPSettingsView(views.APIView):
    """
    API endpoint that allows country programme settings to be viewed.
    """

    @method_decorator(ensure_csrf_cookie)
    def get(self, *args, **kwargs):
        settings = {
            "year_section_mapping": [
                {"max_year": 2018, "sections": ["A", "C", "AdmB", "AdmC", "AdmDE"]},
                {"max_year": 2022, "sections": ["A", "B", "C", "D", "E", "F"]},
            ]
        }
        return Response(settings)
