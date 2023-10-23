from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import mixins, generics
from rest_framework.response import Response

from core.api.serializers.adm import (
    AdmRecordSerializer,
)
from core.api.serializers.cp_emission import CPEmissionSerializer
from core.api.serializers.cp_generation import CPGenerationSerializer
from core.api.serializers.cp_price import CPPricesSerializer
from core.api.serializers.cp_record import CPRecordSerializer
from core.api.serializers.cp_report import CPReportSerializer
from core.api.utils import SECTION_ANNEX_MAPPING
from core.models.adm import AdmRecord
from core.models.blend import Blend
from core.models.country_programme import (
    CPEmission,
    CPGeneration,
    CPPrices,
    CPRecord,
    CPReport,
)
from core.models.substance import Substance
from core.utils import IMPORT_DB_MAX_YEAR


class CPRecordListView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows country programme records to be viewed.
    @param country_programme_id: int - query filter for country programme id (exact)
    @param name: str - query filter for name (contains)
    @param year: int - query filter for year (exact)
    """

    def _get_cp_record(self, cp_report_id, section):
        return (
            CPRecord.objects.select_related(
                "substance__group",
                "blend",
                "country_programme_report__country",
            )
            .prefetch_related(
                "record_usages__usage",
                "substance__excluded_usages",
                "blend__excluded_usages",
                "blend__components",
            )
            .filter(country_programme_report_id=cp_report_id, section=section)
            .all()
        )

    def _set_chemical_records_dict(
        self, chemical_list, chemical_dict, chemical_type, section, cp_report_id
    ):
        """
        Set chemical records dict


        @param chemical_list: list of substances or blends
        @param chemical_dict: dict of substances or blends ( key: id, value: chemical record)
        @param chemical_type: str - "substance" or "blend"
        @param section: str - section name

        @return: dict of chemical records
            structure: {chemical_id: CPRecord object}
        """
        for chemical in chemical_list:
            if chemical.id not in chemical_dict:
                cp_record_data = {
                    "country_programme_report_id": cp_report_id,
                    "substance_id": chemical.id
                    if chemical_type == "substance"
                    else None,
                    "blend_id": chemical.id if chemical_type == "blend" else None,
                    "section": section,
                    "id": 0,
                }
                chemical_dict[chemical.id] = CPRecord(**cp_record_data)

        return chemical_dict

    def _get_displayed_records(self, cp_report_id, section):
        """
        Returns a list of CPRecord objects for the given section and cp_report_id
        -> if there is no record for a substance or blend that is displayed in all formats
             then append a new CPRecord object to the list with the substance or blend

        @param cp_report_id: int - country programme report id
        @param section: str - section name

        @return: list of CPRecord objects
        """

        exist_records = self._get_cp_record(cp_report_id, section)
        subs_rec_dict = {
            record.substance_id: record for record in exist_records if record.substance
        }
        blends_rec_dict = {
            record.blend_id: record for record in exist_records if record.blend
        }

        # get all substances and blends
        annexes = SECTION_ANNEX_MAPPING.get(section, [])
        substances = (
            Substance.objects.filter(displayed_in_all=True)
            .select_related("group")
            .filter(group__annex__in=annexes)
            .all()
        )
        blends = []
        if section == "B":
            blends = Blend.objects.filter(displayed_in_all=True).all()

        substances_dict = self._set_chemical_records_dict(
            substances, subs_rec_dict, "substance", section, cp_report_id
        )
        blends_dict = self._set_chemical_records_dict(
            blends, blends_rec_dict, "blend", section, cp_report_id
        )

        final_list = list(substances_dict.values()) + list(blends_dict.values())
        final_list.sort(
            key=lambda x: (x.substance.group.name, x.substance.name)
            if x.substance
            else ("zzzzz", x.blend.name)
        )

        return final_list

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
                "blend__components",
            )
            .all()
        )

    def _get_new_cp_records(self, cp_report):
        section_a = self._get_displayed_records(cp_report.id, "A")
        section_b = self._get_displayed_records(cp_report.id, "B")
        section_c = self._get_cp_prices(cp_report.id)
        section_d = self._get_items_filtered_by_report(CPGeneration, cp_report.id)
        section_e = self._get_items_filtered_by_report(CPEmission, cp_report.id)
        section_f = {
            "remarks": cp_report.comment,
        }

        return Response(
            {
                "cp_report": CPReportSerializer(cp_report).data,
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
        section_a = self._get_displayed_records(cp_report.id, "A")
        adm_b = self._get_adm_records(cp_report.id, "B")
        adm_b = self._get_regroupped_adm_records(adm_b)
        section_c = self._get_cp_prices(cp_report.id)
        adm_c = self._get_adm_records(cp_report.id, "C")
        adm_c = self._get_regroupped_adm_records(adm_c)
        adm_d = self._get_adm_records(cp_report.id, "D")

        return Response(
            {
                "cp_report": CPReportSerializer(cp_report).data,
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
