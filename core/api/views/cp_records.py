from django.db.models import Q
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import views
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.api.serializers.adm import (
    AdmRecordSerializer,
)
from core.api.permissions import IsUserAllowedCP
from core.api.serializers.cp_comment import (
    CPCommentSerializer,
    CPCommentArchiveSerializer,
)
from core.api.serializers.cp_emission import CPEmissionSerializer
from core.api.serializers.cp_generation import CPGenerationSerializer
from core.api.serializers.cp_history import CPHistorySerializer
from core.api.serializers.cp_price import CPPricesSerializer
from core.api.serializers.cp_record import (
    CPRecordReadOnlySerializer,
)
from core.api.serializers.cp_report import CPReportSerializer, CPReportInfoSerializer
from core.api.views.utils import get_cp_report_from_request
from core.models.adm import AdmRecord
from core.models.country_programme import (
    CPEmission,
    CPGeneration,
    CPPrices,
    CPRecord,
    CPReport,
    CPReportFormatRow,
)
from core.models.country_programme_archive import CPReportArchive
from core.utils import IMPORT_DB_MAX_YEAR, IMPORT_DB_OLDEST_MAX_YEAR

# pylint: disable=E1102


class CPRecordBaseListView(views.APIView):
    """
    API endpoint that allows country programme records to be viewed.
    !!!! We also use this view for CPRecordsArchiveListView
    @param cp_report_id: int - query filter for country programme id (exact)
    @param name: str - query filter for name (contains)
    @param year: int - query filter for year (exact)
    """

    permission_classes = [IsUserAllowedCP]

    cp_report_class = None
    cp_record_class = None
    cp_prices_class = None
    cp_generation_class = None
    cp_emission_class = None
    adm_record_class = None

    cp_report_seri_class = None
    cp_report_info_seri_class = None
    cp_record_seri_class = None
    cp_prices_seri_class = None
    cp_generation_seri_class = None
    cp_emission_seri_class = None
    cp_comment_seri_class = None
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
        existing_items,
        section,
        cp_report,
    ):
        """
        Set chemical records dict that are displayed for this report and section

        @param existing_items: list of existing ItemCls objects (CPRecord / CPPrices)
        @param section: str - section name
        @param cp_report: obj - CPReport object

        @return: dict of chemical records
            structure: {chemical_id: CPRecord object}
        """
        # set existing_items_dict
        existing_items_dict = {}
        for item in existing_items:
            dict_key = (
                f"blend_{item.blend_id}"
                if item.blend
                else f"substance_{item.substance_id}"
            )
            existing_items_dict[dict_key] = item

        # get all substances or blends that are displayed in all formats
        displayed_rows = (
            CPReportFormatRow.objects.get_for_year(cp_report.year)
            .filter(section=section)
            .select_related("substance__group", "blend")
            .prefetch_related(
                "substance__excluded_usages",
                "blend__excluded_usages",
                "blend__components",
            )
            .all()
        )

        # add substances or blends that are not in the existing_items_dict yet
        for row in displayed_rows:
            chemical = row.substance or row.blend
            chemical_key = (
                f"blend_{chemical.id}" if row.blend else f"substance_{chemical.id}"
            )
            if chemical_key not in existing_items_dict:
                cp_record_data = {
                    "country_programme_report": cp_report,
                    "substance": chemical if row.substance else None,
                    "blend": chemical if row.blend else None,
                    "id": 0,
                }
                if section in ["A", "B"]:
                    cp_record_data["section"] = section
                existing_items_dict[chemical_key] = item_cls(**cp_record_data)
            existing_items_dict[chemical_key].sort_order = row.sort_order

        return list(existing_items_dict.values())

    def _get_displayed_items(
        self, item_cls, cp_report, section, existing_items, with_sort=True
    ):
        """
        Returns a list of ItemCls objects for the given section and cp_report_id
         -> if there is no record for a substance or blend that is displayed in all formats
                then append a new ItemCls object to the list with the substance or blend
                and the cp_report_id

        @param item_cls: ItemCls class (CPRecord / CPPrices)
        @param cp_report_id: int - country programme report id
        @param section: str - section name
        @param existing_items: list of existing ItemCls objects
        @param with_sort: bool - if True, sort the final list

        @return: final list of ItemCls objects
        """

        # set the list of chemicals that are displayed for this report and section
        final_list = self._set_chemical_items_dict(
            item_cls, existing_items, section, cp_report
        )

        if with_sort:
            final_list.sort(
                key=lambda x: (
                    (
                        (
                            x.substance.group.name
                            if "Other" not in x.substance.group.name_alt
                            else "zzzbbb"
                        ),  # other substances needs to be displayed last
                        getattr(x, "sort_order", float("inf")),
                        x.substance.sort_order,
                        x.substance.name,
                    )
                    if x.substance
                    else (
                        "zzzaaa",
                        getattr(x, "sort_order", float("inf")),
                        x.blend.sort_order or float("inf"),
                        x.blend.name,
                    )
                )
            )

        return final_list

    def _get_displayed_records(self, cp_report, section):
        """
        Returns a list of CPRecord objects for the given section and cp_report_id

        @param cp_report_id: int - country programme report id
        @param section: str - section name

        @return: list of CPRecord objects
        """

        exist_records = self._get_cp_record(cp_report.id, section)
        final_list = self._get_displayed_items(
            self.cp_record_class, cp_report, section, exist_records
        )

        return final_list

    def _get_adm_records(self, cp_report_id, section):
        return (
            self.adm_record_class.objects.select_related("row", "column")
            .filter(country_programme_report_id=cp_report_id, section=section)
            .filter(  # filter by cp_report
                Q(row__country_programme_report_id=cp_report_id)
                | Q(row__country_programme_report_id__isnull=True)
            )
            .order_by("row__sort_order", "column__sort_order")
            .all()
        )

    def _get_items_filtered_by_report(self, cls, cp_report_id):
        return cls.objects.filter(country_programme_report=cp_report_id).all()

    def _get_cp_prices(self, cp_report):
        exist_records = (
            self.cp_prices_class.objects.select_related("substance__group", "blend")
            .filter(country_programme_report=cp_report.id)
            .all()
        )
        final_list = self._get_displayed_items(
            self.cp_prices_class, cp_report, "C", exist_records, with_sort=False
        )
        # set sort order for section C (we have set sor_order )
        final_list.sort(
            key=lambda x: (
                (
                    (
                        x.substance.name[:4]
                        if "HCFC" in x.substance.name or "HFC" in x.substance.name
                        else "zzzBBB"
                    ),  # other substances needs to be displayed last
                    getattr(x, "sort_order", float("inf")),
                    x.substance.sort_order,
                    x.substance.name,
                )
                if x.substance
                else (
                    "zzzAAA",
                    getattr(x, "sort_order", float("inf")),
                    x.blend.sort_order or float("inf"),
                    x.blend.name,
                )
            )
        )

        # get last_year cp_report
        last_year_cp_report = self.cp_report_class.objects.filter(
            country=cp_report.country, year=cp_report.year - 1
        ).first()
        if not last_year_cp_report:
            return final_list

        # get last_year cp_prices
        last_year_cp_prices = self.cp_prices_class.objects.filter(
            country_programme_report=last_year_cp_report.id
        ).all()
        ly_subst_prices_dict = {
            item.substance_id: item for item in last_year_cp_prices if item.substance
        }
        ly_blend_prices_dict = {
            item.blend_id: item for item in last_year_cp_prices if item.blend
        }
        # set last_year prices
        for price in final_list:
            last_year_price = None
            if price.substance:
                last_year_price = ly_subst_prices_dict.get(price.substance_id)
            elif price.blend:
                last_year_price = ly_blend_prices_dict.get(price.blend_id)
            if last_year_price:
                price.computed_prev_year_price = last_year_price.current_year_price

        return final_list

    def _get_04_cp_records(self, cp_report):
        section_a = self._get_displayed_records(cp_report, "A")
        return {
            "cp_report": self.cp_report_seri_class(cp_report).data,
            "section_a": self.cp_record_seri_class(section_a, many=True).data,
        }

    def _get_cp_history(self, cp_report):
        history = []
        cp_report_final = (
            CPReport.objects.filter(
                country=cp_report.country,
                year=cp_report.year,
            ).first()
            if self.cp_report_class != CPReport
            else cp_report
        )
        if cp_report_final:
            history_qs = cp_report_final.cphistory.all().select_related(
                "country_programme_report", "updated_by"
            )
            history = CPHistorySerializer(history_qs, many=True).data

        return history

    def _get_serialized_cp_comments(self, cp_report):
        """
        Returns current version's comments if current CPReport is final;
        if it's draft, it returns the comments from the latest FINAL version.
        """
        if cp_report.status == CPReport.CPReportStatus.DRAFT:
            final_report = (
                CPReportArchive.objects.filter(
                    country=cp_report.country,
                    year=cp_report.year,
                    status=CPReport.CPReportStatus.FINAL,
                )
                .order_by("-version")
                .first()
            )

            return (
                CPCommentArchiveSerializer(
                    final_report.cpcomments.all(), many=True
                ).data
                if final_report
                else []
            )

        return self.cp_comment_seri_class(cp_report.cpcomments.all(), many=True).data

    def _get_new_cp_records(self, cp_report):
        section_a = self._get_displayed_records(cp_report, "A")
        section_b = self._get_displayed_records(cp_report, "B")
        section_c = self._get_cp_prices(cp_report)
        section_d = self._get_items_filtered_by_report(
            self.cp_generation_class, cp_report.id
        )
        section_e = self._get_items_filtered_by_report(
            self.cp_emission_class, cp_report.id
        )
        section_f = {
            "remarks": cp_report.comment,
        }

        ret = {
            "cp_report": self.cp_report_seri_class(cp_report).data,
            "section_a": self.cp_record_seri_class(section_a, many=True).data,
            "section_b": self.cp_record_seri_class(section_b, many=True).data,
            "section_c": self.cp_prices_seri_class(section_c, many=True).data,
            "section_d": self.cp_generation_seri_class(section_d, many=True).data,
            "section_e": self.cp_emission_seri_class(section_e, many=True).data,
            "section_f": section_f,
            "history": self._get_cp_history(cp_report),
            "comments": self._get_serialized_cp_comments(cp_report),
        }
        if hasattr(cp_report, "cpreportedsections"):
            # This property will not be present for pre-2023
            ret["report_info"] = self.cp_report_info_seri_class(
                cp_report.cpreportedsections
            ).data

        return ret

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

    def _get_adm_d_records(self, adm_records):
        result = {}
        for adm_record in adm_records:
            row_id = adm_record.row_id
            result[row_id] = self.adm_record_seri_class(adm_record).data
        return result

    def _get_old_cp_records(self, cp_report):
        section_a = self._get_displayed_records(cp_report, "A")
        adm_b = self._get_adm_records(cp_report.id, "B")
        adm_b = self._get_regroupped_adm_records(adm_b)
        section_c = self._get_cp_prices(cp_report)
        adm_c = self._get_adm_records(cp_report.id, "C")
        adm_c = self._get_regroupped_adm_records(adm_c)
        adm_d = self._get_adm_records(cp_report.id, "D")
        adm_d = self._get_adm_d_records(adm_d)

        return {
            "cp_report": self.cp_report_seri_class(cp_report).data,
            "section_a": self.cp_record_seri_class(section_a, many=True).data,
            "adm_b": adm_b,
            "section_c": self.cp_prices_seri_class(section_c, many=True).data,
            "adm_c": adm_c,
            "adm_d": adm_d,
        }

    def _get_cp_report(self):
        cp_report = get_cp_report_from_request(self.request, self.cp_report_class)
        if not cp_report:
            raise ValidationError({"error": "Country programme report not found"})
        return cp_report

    def get_data(self, cp_report):
        if cp_report.year <= IMPORT_DB_OLDEST_MAX_YEAR:
            return self._get_04_cp_records(cp_report)
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
            openapi.Parameter(
                "country_id",
                openapi.IN_QUERY,
                description="Country id for the country programme report",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "year",
                openapi.IN_QUERY,
                description="Year for the country programme report",
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
    cp_report_info_seri_class = CPReportInfoSerializer
    cp_record_seri_class = CPRecordReadOnlySerializer
    cp_prices_seri_class = CPPricesSerializer
    cp_generation_seri_class = CPGenerationSerializer
    cp_emission_seri_class = CPEmissionSerializer
    cp_comment_seri_class = CPCommentSerializer
    adm_record_seri_class = AdmRecordSerializer
