from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import mixins, generics, status
from rest_framework.response import Response

from core.api.filters.country_programme import (
    CPReportFilter,
)
from core.api.serializers import (
    CPReportSerializer,
    CPRecordSerializer,
)
from core.api.serializers.adm import AdmRecordSerializer
from core.api.serializers.country_programme import (
    CPEmissionSerializer,
    CPGenerationSerializer,
    CPPricesSerializer,
)
from core.models.adm import AdmRecord
from core.models.country_programme import (
    CPEmission,
    CPGeneration,
    CPPrices,
    CPRecord,
    CPReport,
)
from core.utils import IMPORT_DB_MAX_YEAR


# view for country programme reports
class CPReportView(generics.ListAPIView, generics.CreateAPIView):
    """
    API endpoint that allows country programmes to be viewed.
    @param country_id: int - query filter for country id (exact)
    @param name: str - query filter for name (contains)
    @param year: int - query filter for year (exact)
    """

    queryset = CPReport.objects.select_related("country").order_by("name")
    filterset_class = CPReportFilter
    serializer_class = CPReportSerializer

    def _create_cp_records(self, cp_report, section_data, section):
        for record in section_data:
            record["country_programme_report_id"] = cp_report.id
            record["section"] = section
            record_serializer = CPRecordSerializer(data=record)
            record_serializer.is_valid(raise_exception=True)
            record_serializer.save()

    def _create_prices(self, cp_report, section_data):
        for price in section_data:
            price["country_programme_report_id"] = cp_report.id
            price_serializer = CPPricesSerializer(data=price)
            price_serializer.is_valid(raise_exception=True)
            price_serializer.save()

    def _create_generation(self, cp_report, section_data):
        for generation in section_data:
            generation["country_programme_report_id"] = cp_report.id
            generation_serializer = CPGenerationSerializer(data=generation)
            generation_serializer.is_valid(raise_exception=True)
            generation_serializer.save()

    def _create_emission(self, cp_report, section_data):
        for emission in section_data:
            emission["country_programme_report_id"] = cp_report.id
            emission_serializer = CPEmissionSerializer(data=emission)
            emission_serializer.is_valid(raise_exception=True)
            emission_serializer.save()

    def _add_remarks(self, cp_report, section_data):
        cp_report.comment = section_data.get("remarks", "")
        cp_report.save()

    def post(self, request, *args, **kwargs):
        # create cp report
        cp_report_data = {
            "name": request.data.get("name"),
            "year": request.data.get("year"),
            "country_id": request.data.get("country_id"),
        }
        cp_report_serializer = CPReportSerializer(data=cp_report_data)
        cp_report_serializer.is_valid(raise_exception=True)
        cp_report = cp_report_serializer.save()

        # create records
        self._create_cp_records(cp_report, request.data.get("section_a", []), "A")
        self._create_cp_records(cp_report, request.data.get("section_b", []), "B")
        self._create_prices(cp_report, request.data.get("section_c", []))
        self._create_generation(cp_report, request.data.get("section_d", []))
        self._create_emission(cp_report, request.data.get("section_e", []))
        self._add_remarks(cp_report, request.data.get("section_f", {}))

        response = CPReportSerializer(cp_report).data
        return Response(response, status=status.HTTP_200_OK)


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
            CPRecord.objects.select_related("substance__group", "blend")
            .prefetch_related("record_usages__usage")
            .filter(country_programme_report_id=cp_report_id, section=section)
            .order_by(
                "section",
                "substance__group__name",
                "substance__name",
            )
            .all()
        )

    def _get_adm_records(self, cp_report_id, section):
        return (
            AdmRecord.objects.select_related("row", "column")
            .filter(
                country_programme_report_id=cp_report_id,
                section=section,
            )
            .order_by("row__sort_order", "column__sort_order")
            .all()
        )

    def _get_items_filtered_by_report(self, cls, cp_report_id):
        return cls.objects.filter(country_programme_report=cp_report_id).all()

    def _get_cp_prices(self, cp_report_id):
        return (
            CPPrices.objects.select_related("substance__group", "blend")
            .filter(country_programme_report=cp_report_id)
            .order_by(
                "substance__group__name",
                "substance__name",
            )
            .all()
        )

    def _get_new_cp_records(self, cp_report):
        section_a = self._get_cp_record(cp_report.id, "A")
        section_b = self._get_cp_record(cp_report.id, "B")
        section_c = self._get_cp_prices(cp_report.id)
        section_d = self._get_items_filtered_by_report(CPGeneration, cp_report.id)
        section_e = self._get_items_filtered_by_report(CPEmission, cp_report.id)
        section_f = {
            "remarks": cp_report.comment,
        }

        return Response(
            {
                "section_a": CPRecordSerializer(section_a, many=True).data,
                "section_b": CPRecordSerializer(section_b, many=True).data,
                "section_c": CPPricesSerializer(section_c, many=True).data,
                "section_d": CPGenerationSerializer(section_d, many=True).data,
                "section_e": CPEmissionSerializer(section_e, many=True).data,
                "section_f": section_f,
            }
        )

    def _get_regroupped_adm_records(self, adm_records):
        result = {}
        for adm_record in adm_records:
            row_id = adm_record.row_id
            if row_id not in result:
                result[row_id] = {
                    "row_id": row_id,
                    "row_text": str(adm_record.row),
                    "values": [],
                }
            result[row_id]["values"].append(AdmRecordSerializer(adm_record).data)
        return list(result.values())

    def _get_old_cp_records(self, cp_report):
        section_a = self._get_cp_record(cp_report.id, "A")
        adm_b = self._get_adm_records(cp_report.id, "B")
        adm_b = self._get_regroupped_adm_records(adm_b)
        section_c = self._get_cp_prices(cp_report.id)
        adm_c = self._get_adm_records(cp_report.id, "C")
        adm_c = self._get_regroupped_adm_records(adm_c)
        adm_d = self._get_adm_records(cp_report.id, "D")

        return Response(
            {
                "section_a": CPRecordSerializer(section_a, many=True).data,
                "adm_b": adm_b,
                "section_c": CPPricesSerializer(section_c, many=True).data,
                "adm_c": adm_c,
                "adm_d": AdmRecordSerializer(adm_d, many=True).data,
            }
        )

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "cp_report_id",
                openapi.IN_QUERY,
                description="Country programme report id",
                type=openapi.TYPE_INTEGER,
            ),
        ],
    )
    def get(self, *args, **kwargs):
        cp_report_id = self.request.query_params.get("cp_report_id", None)
        if not cp_report_id:
            return Response({"error": "cp_report_id is required"}, status=400)

        cp_report = CPReport.objects.filter(id=cp_report_id).first()
        if not cp_report:
            return Response({"error": "cp_report_id is invalid"}, status=400)

        if cp_report.year > IMPORT_DB_MAX_YEAR:
            return self._get_new_cp_records(cp_report)

        return self._get_old_cp_records(cp_report)
