from collections import defaultdict
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import views, generics
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.api.filters.country_programme import DashboardsCPRecordFilter
from core.api.serializers.adm import (
    AdmRecordSerializer,
)
from core.api.permissions import IsCountryUser, IsSecretariat, IsViewer, IsCPViewer
from core.api.serializers.cp_comment import CPCommentSerializer
from core.api.serializers.cp_emission import CPEmissionSerializer
from core.api.serializers.cp_generation import CPGenerationSerializer
from core.api.serializers.cp_history import CPHistorySerializer
from core.api.serializers.cp_price import CPPricesSerializer
from core.api.serializers.cp_record import (
    DashboardsCPRecordSerializer,
    CPRecordReadOnlySerializer,
)
from core.api.serializers.cp_report import CPReportSerializer, CPReportInfoSerializer
from core.api.views.utils import (
    copy_fields,
    delete_fields,
    get_country_region_dict,
    get_cp_prices,
    get_cp_report_from_request,
    get_displayed_records,
    rename_fields,
)
from core.model_views.country_programme import AllCPRecordsView, AllCPUsagesView
from core.models.adm import AdmRecord
from core.models.country_programme import (
    CPEmission,
    CPGeneration,
    CPPrices,
    CPRecord,
    CPReport,
)
from core.models.country_programme_archive import (
    CPEmissionArchive,
    CPGenerationArchive,
    CPPricesArchive,
    CPRecordArchive,
    CPReportArchive,
)
from core.models.group import Group
from core.models.usage import Usage
from core.utils import IMPORT_DB_MAX_YEAR, IMPORT_DB_OLDEST_MAX_YEAR

# pylint: disable=E1102


class CPRecordBaseListByReportView(views.APIView):
    """
    API endpoint that allows country programme records to be viewed
        (records specific to a report).
    !!!! We also use this view for CPRecordsArchiveListView
    @param cp_report_id: int - query filter for country programme id (exact)
    @param name: str - query filter for name (contains)
    @param year: int - query filter for year (exact)
    """

    permission_classes = [IsSecretariat | IsCountryUser | IsViewer | IsCPViewer]

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
        final_list = get_cp_prices(cp_report, self.cp_prices_class)

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
        section_a = get_displayed_records(cp_report, "A", self.cp_record_class)
        return {
            "cp_report": self.cp_report_seri_class(cp_report).data,
            "section_a": self.cp_record_seri_class(section_a, many=True).data,
        }

    def _get_cp_history(self, cp_report, full_history=False):
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
            if not full_history:
                history_qs = history_qs.filter(event_in_draft=False)
                history_qs = history_qs.exclude(
                    Q(event_description__istartswith="status changed")
                    | Q(event_description__istartswith="status updated")
                    | Q(event_description__istartswith="reverted to previous")
                )
            history = CPHistorySerializer(history_qs, many=True).data

        return history

    def _get_serialized_cp_comments(self, cp_report):
        return self.cp_comment_seri_class(cp_report.cpcomments.all(), many=True).data

    def _get_new_cp_records(self, cp_report, data_only=False, full_history=False):
        section_a = get_displayed_records(cp_report, "A", self.cp_record_class)
        section_b = get_displayed_records(cp_report, "B", self.cp_record_class)
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
            "section_a": self.cp_record_seri_class(section_a, many=True).data,
            "section_b": self.cp_record_seri_class(section_b, many=True).data,
            "section_c": self.cp_prices_seri_class(section_c, many=True).data,
            "section_d": self.cp_generation_seri_class(section_d, many=True).data,
            "section_e": self.cp_emission_seri_class(section_e, many=True).data,
            "section_f": section_f,
        }
        if data_only is False:
            ret["cp_report"] = self.cp_report_seri_class(cp_report).data
            ret["history"] = self._get_cp_history(cp_report, full_history)
            ret["comments"] = self._get_serialized_cp_comments(cp_report)

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
        section_a = get_displayed_records(cp_report, "A", self.cp_record_class)
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

    def get_data(self, cp_report, full_history=False):
        if cp_report.year <= IMPORT_DB_OLDEST_MAX_YEAR:
            return self._get_04_cp_records(cp_report)
        if cp_report.year > IMPORT_DB_MAX_YEAR:
            return self._get_new_cp_records(cp_report, False, full_history)

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
            openapi.Parameter(
                "full_history",
                openapi.IN_QUERY,
                description="Include full event history for the country programme report",
                type=openapi.TYPE_BOOLEAN,
            ),
        ],
    )
    def get(self, *args, **kwargs):
        full_history = self.request.query_params.get("full_history") == "1"
        return Response(self.get_data(self._get_cp_report(), full_history))


class CPRecordListByReportView(CPRecordBaseListByReportView):
    """
    API endpoint that allows country programme records specific to a report to be viewed.
    """

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


class CPRecordListDiffView(CPRecordListByReportView):
    section_a_b_fields = [
        "imports",
        "import_quotas",
        "exports",
        "export_quotas",
        "production",
        "imports_gwp",
        "import_quotas_gwp",
        "exports_gwp",
        "export_quotas_gwp",
        "production_gwp",
        "imports_odp",
        "import_quotas_odp",
        "exports_odp",
        "export_quotas_odp",
        "production_odp",
        "banned_date",
        "remarks",
    ]
    section_c_fields = ["previous_year_price", "current_year_price", "remarks"]
    section_d_fields = ["all_uses", "feedstock", "destruction"]
    section_e_fields = [
        "total",
        "all_uses",
        "feedstock_gc",
        "destruction",
        "feedstock_wpc",
        "destruction_wpc",
        "generated_emissions",
        "remarks",
    ]

    def set_archive_class_attributes(self):
        self.cp_report_class = CPReportArchive
        self.cp_record_class = CPRecordArchive
        self.cp_prices_class = CPPricesArchive
        self.cp_generation_class = CPGenerationArchive
        self.cp_emission_class = CPEmissionArchive

    def diff_records(
        self, data, data_old, fields, row_identifier="row_id", is_section_d_e=False
    ):
        usage_fields = ["quantity", "quantity_gwp", "quantity_odp"]
        diff_data = []

        # We only want actually-reported substances in the diff
        data = [item for item in data if item.get("id") != 0]
        data_old = [item for item in data_old if item.get("id") != 0]
        records_old = {record[row_identifier]: record for record in data_old}

        for record in data:
            record_old = records_old.pop(record[row_identifier], None)

            # Prepare data for comparison
            if is_section_d_e:
                delete_fields(record, ["row_id"])
                if record_old:
                    delete_fields(record_old, ["row_id"])
            delete_fields(record, ["id"])
            if record_old:
                delete_fields(record_old, ["id"])

            # And now actually compare
            if record == record_old:
                # Only display newly-added or changed records
                continue
            copy_fields(record, record_old, fields)
            record["change_type"] = "changed" if record_old else "new"

            # Also copy nested usage fields
            old_record_usages = (
                record_old.get("record_usages", []) if record_old else []
            )
            usages_old = {str(usage["usage_id"]): usage for usage in old_record_usages}
            for usage in record.get("record_usages", []):
                usage_old = usages_old.pop(str(usage["usage_id"]), None)
                copy_fields(usage, usage_old, usage_fields)

            diff_data.append(record)

        for record in records_old.values():
            rename_fields(record, fields)
            for usage in record.get("record_usages", []):
                rename_fields(usage, usage_fields)
            record["change_type"] = "deleted"
            diff_data.append(record)

        return diff_data

    def get(self, *args, **kwargs):
        cp_report = self._get_cp_report()
        version = self.request.query_params.get("version")
        version = float(version) if version else None
        if version and version < cp_report.version:
            cp_report = get_object_or_404(
                CPReportArchive,
                version=version,
                country=cp_report.country,
                year=cp_report.year,
            )
        # We are diff-ing with the previous version by default
        ar_version = cp_report.version - 1
        cp_report_ar = get_object_or_404(
            CPReportArchive,
            version=ar_version,
            country=cp_report.country,
            year=cp_report.year,
        )

        if isinstance(cp_report, CPReportArchive):
            self.set_archive_class_attributes()
        data = self._get_new_cp_records(cp_report, data_only=True)
        self.set_archive_class_attributes()
        data_old = self._get_new_cp_records(cp_report_ar, data_only=True)

        section_f_diff = (
            []
            if cp_report.comment == cp_report_ar.comment
            else [
                {
                    "remarks": cp_report.comment,
                    "remarks_old": cp_report_ar.comment,
                },
            ]
        )

        return Response(
            {
                "section_a": self.diff_records(
                    data["section_a"], data_old["section_a"], self.section_a_b_fields
                ),
                "section_b": self.diff_records(
                    data["section_b"], data_old["section_b"], self.section_a_b_fields
                ),
                "section_c": self.diff_records(
                    data["section_c"], data_old["section_c"], self.section_c_fields
                ),
                "section_d": self.diff_records(
                    data["section_d"],
                    data_old["section_d"],
                    self.section_d_fields,
                    row_identifier="chemical_name",
                    is_section_d_e=True,
                ),
                "section_e": self.diff_records(
                    data["section_e"],
                    data_old["section_e"],
                    self.section_e_fields,
                    row_identifier="facility",
                    is_section_d_e=True,
                ),
                "section_f": section_f_diff,
            }
        )


class DashboardsCPRecordView(generics.ListAPIView):
    """
    API endpoint that allows country programme records to be viewed.
    """

    filter_backends = [DjangoFilterBackend]
    filterset_class = DashboardsCPRecordFilter
    serializer_class = DashboardsCPRecordSerializer
    queryset = AllCPRecordsView.objects.filter(
        report_status=CPReport.CPReportStatus.FINAL
    ).order_by(
        "-report_year",
        "country_name",
        "-report_version",
        "substance_sort_order",
        "blend_sort_order",
    )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        usages = Usage.objects.all()
        usages_dict = {}
        for usage in usages:
            usages_dict[usage.id] = {"name": usage.full_name, "quantity": 0}
        ctx["usages_dict"] = usages_dict
        ctx["country_region_dict"] = get_country_region_dict()
        ctx["annex_f"] = Group.objects.get(name="F")
        return ctx

    def get_context_with_existing_usages(self, records_qs):
        """
        Get the serializer context with the existing usages for the records
        In other words, add the existing usages to the serializer context

        :param records_qs: the queryset of the records

        """
        # create filters list in order to get all usages for the records
        records_pairs = records_qs.values_list("id", "is_archive")
        filters = Q()
        for record_id, is_archive in records_pairs:
            filters |= Q(country_programme_record_id=record_id, is_archive=is_archive)

        # get all usages for the records
        usages = AllCPUsagesView.objects.filter(filters)

        # create a dictionary with the usages for each record
        usages_dict = defaultdict(list)
        for usage in usages:
            usages_dict[(usage.country_programme_record_id, usage.is_archive)].append(
                usage
            )

        # create the serializer context
        serializer_context = self.get_serializer_context()
        serializer_context["existing_usages_dict"] = usages_dict

        return serializer_context

    def get(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer_context = self.get_context_with_existing_usages(page)
            serializer = self.get_serializer(
                page, many=True, context=serializer_context
            )
            return self.get_paginated_response(serializer.data)

        serializer_context = self.get_context_with_existing_usages(queryset)
        serializer = self.get_serializer(
            queryset, many=True, context=serializer_context
        )
        return Response(serializer.data)
