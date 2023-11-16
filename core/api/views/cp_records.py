from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import mixins, generics
from rest_framework.exceptions import ValidationError
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

# pylint: disable=E1102


class CPRecordBaseListView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows country programme records to be viewed.
    !!!! We also use this view for CPRecordsArchiveListView
    @param cp_report_id: int - query filter for country programme id (exact)
    @param name: str - query filter for name (contains)
    @param year: int - query filter for year (exact)
    """

    cp_report_class = None
    cp_record_class = None
    cp_prices_class = None
    cp_generation_class = None
    cp_emission_class = None
    adm_record_class = None

    cp_report_seri_class = None
    cp_record_seri_class = None
    cp_prices_seri_class = None
    cp_generation_seri_class = None
    cp_emission_seri_class = None
    adm_record_seri_class = None

    def _get_cp_record(self, cp_report_id, section):
        return (
            self.cp_record_class.objects.select_related(
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

    def _set_chemical_items_dict(
        self,
        item_cls,
        chemical_dict,
        chemical_type,
        section,
        cp_report_id,
    ):
        """
        Set chemical records dict

        @param chemical_dict: dict of substances or blends ( key: id, value: chemical record)
        @param chemical_type: str - "substance" or "blend"
        @param section: str - section name
        @param cp_report_id: int - country programme report id

        @return: dict of chemical records
            structure: {chemical_id: CPRecord object}
        """
        # get all substances or blends that are displayed in all formats
        chemical_list = []
        if chemical_type == "substance":
            annexes = SECTION_ANNEX_MAPPING.get(section, [])
            chemical_list = (
                Substance.objects.filter(displayed_in_all=True)
                .select_related("group")
                .filter(group__annex__in=annexes)
                .all()
            )
        elif chemical_type == "blend" and section in ["B", "C"]:
            chemical_list = Blend.objects.filter(displayed_in_all=True).all()

        # set the chemical dict
        for chemical in chemical_list:
            if chemical.id not in chemical_dict:
                cp_record_data = {
                    "country_programme_report_id": cp_report_id,
                    "substance_id": chemical.id
                    if chemical_type == "substance"
                    else None,
                    "blend_id": chemical.id if chemical_type == "blend" else None,
                    "id": 0,
                }
                if section in ["A", "B"]:
                    cp_record_data["section"] = section
                chemical_dict[chemical.id] = item_cls(**cp_record_data)

        return chemical_dict

    def _get_displayed_items(self, item_cls, cp_report_id, section, existing_items):
        """
        Returns a list of ItemCld objects for the given section and cp_report_id
         -> if there is no record for a substance or blend that is displayed in all formats
                then append a new ItemCls object to the list with the substance or blend
                and the cp_report_id

        @param item_cls: ItemCls class (CPRecord / CPPrices)
        @param cp_report_id: int - country programme report id
        @param section: str - section name
        @param existing_items: list of existing ItemCls objects

        @return: final list of ItemCls objects
        """
        subs_rec_dict = {
            item.substance_id: item for item in existing_items if item.substance
        }
        blends_rec_dict = {item.blend_id: item for item in existing_items if item.blend}

        # get all substances and blends
        substances_dict = self._set_chemical_items_dict(
            item_cls, subs_rec_dict, "substance", section, cp_report_id
        )
        blends_dict = self._set_chemical_items_dict(
            item_cls, blends_rec_dict, "blend", section, cp_report_id
        )

        final_list = list(substances_dict.values()) + list(blends_dict.values())
        final_list.sort(
            key=lambda x: (x.substance.group.name, x.substance.name)
            if x.substance
            else ("zzzzz", x.blend.name)
        )

        return final_list

    def _get_displayed_records(self, cp_report_id, section):
        """
        Returns a list of CPRecord objects for the given section and cp_report_id

        @param cp_report_id: int - country programme report id
        @param section: str - section name

        @return: list of CPRecord objects
        """

        exist_records = self._get_cp_record(cp_report_id, section)
        final_list = self._get_displayed_items(
            self.cp_record_class, cp_report_id, section, exist_records
        )

        return final_list

    def _get_adm_records(self, cp_report_id, section):
        return (
            self.adm_record_class.objects.select_related("row", "column")
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
        exist_records = (
            self.cp_prices_class.objects.select_related("substance__group", "blend")
            .prefetch_related("blend__components")
            .filter(country_programme_report=cp_report_id)
            .all()
        )
        final_list = self._get_displayed_items(
            self.cp_prices_class, cp_report_id, "C", exist_records
        )

        return final_list

    def _get_new_cp_records(self, cp_report):
        section_a = self._get_displayed_records(cp_report.id, "A")
        section_b = self._get_displayed_records(cp_report.id, "B")
        section_c = self._get_cp_prices(cp_report.id)
        section_d = self._get_items_filtered_by_report(
            self.cp_generation_class, cp_report.id
        )
        section_e = self._get_items_filtered_by_report(
            self.cp_emission_class, cp_report.id
        )
        section_f = {
            "remarks": cp_report.comment,
        }

        return {
            "cp_report": self.cp_report_seri_class(cp_report).data,
            "section_a": self.cp_record_seri_class(section_a, many=True).data,
            "section_b": self.cp_record_seri_class(section_b, many=True).data,
            "section_c": self.cp_prices_seri_class(section_c, many=True).data,
            "section_d": self.cp_generation_seri_class(section_d, many=True).data,
            "section_e": self.cp_emission_seri_class(section_e, many=True).data,
            "section_f": section_f,
        }

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
            result[row_id]["values"].append(self.adm_record_seri_class(adm_record).data)
        return list(result.values())

    def _get_old_cp_records(self, cp_report):
        section_a = self._get_displayed_records(cp_report.id, "A")
        adm_b = self._get_adm_records(cp_report.id, "B")
        adm_b = self._get_regroupped_adm_records(adm_b)
        section_c = self._get_cp_prices(cp_report.id)
        adm_c = self._get_adm_records(cp_report.id, "C")
        adm_c = self._get_regroupped_adm_records(adm_c)
        adm_d = self._get_adm_records(cp_report.id, "D")
        adm_d = self._get_regroupped_adm_records(adm_d)

        return {
            "cp_report": self.cp_report_seri_class(cp_report).data,
            "section_a": self.cp_record_seri_class(section_a, many=True).data,
            "adm_b": adm_b,
            "section_c": self.cp_prices_seri_class(section_c, many=True).data,
            "adm_c": adm_c,
            "adm_d": adm_d,
        }

    def _get_cp_report(self):
        try:
            return self.cp_report_class.objects.get(
                id=self.request.query_params["cp_report_id"]
            )
        except KeyError as e:
            raise ValidationError(
                {"cp_report_id": "query parameter is required"}
            ) from e
        except CPReport.DoesNotExist as e:
            raise ValidationError({"cp_report_id": "invalid id"}) from e

    def get_data(self, cp_report):
        if cp_report.year > IMPORT_DB_MAX_YEAR:
            return self._get_new_cp_records(cp_report)

        return self._get_old_cp_records(cp_report)

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
        return Response(self.get_data(self._get_cp_report()))


class CPRecordListView(CPRecordBaseListView):
    cp_report_class = CPReport
    cp_record_class = CPRecord
    cp_prices_class = CPPrices
    cp_generation_class = CPGeneration
    cp_emission_class = CPEmission
    adm_record_class = AdmRecord

    cp_report_seri_class = CPReportSerializer
    cp_record_seri_class = CPRecordSerializer
    cp_prices_seri_class = CPPricesSerializer
    cp_generation_seri_class = CPGenerationSerializer
    cp_emission_seri_class = CPEmissionSerializer
    adm_record_seri_class = AdmRecordSerializer
