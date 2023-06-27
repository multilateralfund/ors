from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import mixins, generics, views
from rest_framework.response import Response

from core.api.filters.country_programme import (
    CPReportFilter,
)
from core.api.serializers import (
    CPReportSerializer,
    CPRecordSerializer,
)
from core.models.country_programme import (
    CPEmission,
    CPGeneration,
    CPPrices,
    CPRecord,
    CPReport,
)


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

    def _get_cp_record(self, cp_report_id, section):
        return (
            CPRecord.objects.select_related("substance", "blend", "group")
            .prefetch_related("record_usages")
            .filter(country_programme_report_id=cp_report_id, section=section)
            .order_by(
                "section",
                "substance__group__name",
                "substance__name",
            )
            .all()
        )

    def _get_items_filtered_by_report(self, cls, cp_report_id):
        return cls.objects.filter(country_programme_report=cp_report_id).all()

    def get(self, *args, **kwargs):
        cp_report_id = self.request.query_params.get("cp_report_id", None)
        if not cp_report_id:
            raise ValueError("cp_report_id is required")

        # section = self.request.query_params.get("section", None)

        section_a = self._get_cp_record(cp_report_id, "A")
        section_b = self._get_cp_record(cp_report_id, "B")
        section_c = self._get_items_filtered_by_report(CPPrices, cp_report_id)
        section_d = self._get_items_filtered_by_report(CPGeneration, cp_report_id)
        section_e = self._get_items_filtered_by_report(CPEmission, cp_report_id)

        return Response(
            {
                "section_a": CPRecordSerializer(section_a, many=True).data,
                "section_b": CPRecordSerializer(section_b, many=True).data,
                "section_c": CPRecordSerializer(section_c, many=True).data,
                "section_d": CPRecordSerializer(section_d, many=True).data,
                "section_e": CPRecordSerializer(section_e, many=True).data,
            }
        )


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
