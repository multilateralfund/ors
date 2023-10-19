from datetime import datetime

from constance import config
from django.db.models import Count
from django.db.models import F
from django.db.models import Window
from django.db.models.functions import RowNumber
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters
from rest_framework import mixins, generics, views, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.api.filters.country_programme import (
    CPReportFilter,
)
from core.api.serializers import CPReportGroupSerializer
from core.api.serializers import (
    CPReportSerializer,
    CPRecordSerializer,
)
from core.api.serializers.adm import (
    AdmColumnSerializer,
    AdmRecordSerializer,
    AdmRowSerializer,
)
from core.api.serializers.country_programme import (
    CPEmissionSerializer,
    CPGenerationSerializer,
    CPPricesSerializer,
    CPReportCreateSerializer,
)
from core.api.serializers.usage import UsageSerializer
from core.api.utils import SECTION_ANNEX_MAPPING
from core.models.adm import AdmColumn, AdmRecord, AdmRow
from core.models.blend import Blend
from core.models.country_programme import (
    CPEmission,
    CPGeneration,
    CPPrices,
    CPRecord,
    CPReport,
    CPReportFormat,
)
from core.models.substance import Substance
from core.utils import IMPORT_DB_MAX_YEAR


# view for country programme reports
class CPReportView(generics.ListAPIView, generics.CreateAPIView):
    """
    API endpoint that allows country programmes to be viewed or created.
    """

    queryset = CPReport.objects.select_related("country").order_by("name")
    filterset_class = CPReportFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]
    ordering_fields = ["year", "country__name"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CPReportCreateSerializer
        return CPReportSerializer

    @swagger_auto_schema(
        operation_description="year < 2019 => required: section_a, adm_b, section_c, adm_c, adm_d\n"
        "year >= 2019 => required: section_a, section_b, section_c, section_d, section_e, section_f",
        request_body=CPReportCreateSerializer,
    )
    def post(self, request, *args, **kwargs):
        serializer = CPReportCreateSerializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, status=status.HTTP_201_CREATED, headers=headers
            )

        custom_errors = self.customize_errors(serializer.errors)
        return Response(custom_errors, status=status.HTTP_400_BAD_REQUEST)

    def customize_errors(self, error_dict):
        """
        Customize errors for country programme report create

        @param error_dict: dict of errors
        e.g. {
            'section_a': [
                {'row_id': ErrorDetail(string='substance_999', code='invalid'),
                'errors': {'substance_id': [ErrorDetail(string='Invalid pk "999" - object does not exist.',
                            code='does_not_exist')]}},
                {'row_id': ErrorDetail(string='subst_1', code='invalid'),
                 'errors': {
                    'record_usages': [{
                        'row_id': ErrorDetail(string='usage_999', code='invalid'),
                        'errors': {'usage_id': [ErrorDetail(string='Invalid pk "999" - object does not exist.',
                                    code='does_not_exist')]}}, {}]}},
                {}
            ],
        }

        @return: dict of custom errors
        e.g. {
            'section_a': {
                'substance_999': {'substance_id': 'Invalid pk "999" - object does not exist.'},
                'subst_1': {
                    'record_usages': {
                        'usage_999': {'usage_id': 'Invalid pk "999" - object does not exist.'}
                    }
                },
            }

        """
        custom_errors = {}
        for section, section_errors in error_dict.items():
            if "adm" in section:
                # we do not need to customize adm errors
                custom_errors[section] = section_errors
                continue

            cust_scetion_err = {}
            for errors in section_errors:
                if not errors:
                    # skip empty errors
                    continue

                if "row_id" not in errors or errors["row_id"] == "general_error":
                    cust_scetion_err["general_error"] = errors
                    continue

                row_id = errors["row_id"]

                cust_scetion_err[row_id] = {}
                if errors["errors"].get("record_usages"):
                    # check if there is an error for record_usages
                    cust_scetion_err[row_id] = self.customize_errors(errors["errors"])
                    continue
                for error_key, error_value in errors["errors"].items():
                    # ('substance_id', [ErrorDetail(string='Invalid pk "999" - object does not exist.',
                    # code='does_not_exist')])
                    cust_scetion_err[row_id][error_key] = error_value[0]

            custom_errors[section] = cust_scetion_err

        return custom_errors


class CPReportGroupByYearView(generics.ListAPIView):
    """
    API endpoint that allows listing country programme reports grouped.
    """

    serializer_class = CPReportGroupSerializer
    group_by = "year"
    group_pk = "year"
    order_by = "country__name"

    @property
    def order_field(self):
        direction = self.request.query_params.get("ordering", "asc").lower()
        if direction not in ("asc", "desc"):
            raise ValidationError({"ordering": f"Invalid value: {direction}"})

        if direction == "asc":
            return self.group_by
        return "-" + self.group_by

    def get_queryset(self):
        return (
            CPReport.objects.values_list(self.group_by, flat=True)
            .distinct()
            .order_by(self.order_field)
        )

    @staticmethod
    def get_group(obj):
        return obj.year

    @staticmethod
    def get_id(obj):
        return obj.year

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "ordering",
                openapi.IN_QUERY,
                description="Order results in ascending or descending order",
                default="asc",
                type=openapi.TYPE_STRING,
                enum=["asc", "desc"],
            ),
        ],
    )
    def list(self, request, *args, **kwargs):
        totals = dict(
            CPReport.objects.values_list(self.group_pk).annotate(count=Count(1))
        )

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        queryset = (
            CPReport.objects.annotate(
                row_number=Window(
                    expression=RowNumber(),
                    partition_by=[F(self.group_by)],
                    order_by=self.order_by,
                ),
            )
            .filter(
                **{
                    f"{self.group_by}__in": (page or queryset),
                    "row_number__lte": config.CP_NR_REPORTS,
                }
            )
            .order_by(self.order_field, self.order_by)
        )

        grouped_data = {}
        for obj in queryset:
            pk = self.get_id(obj)
            if pk not in grouped_data:
                grouped_data[pk] = {
                    "id": pk,
                    "count": totals[pk],
                    "group": self.get_group(obj),
                    "reports": [],
                }
            grouped_data[pk]["reports"].append(obj)

        serializer = self.get_serializer(grouped_data.values(), many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)


class CPReportGroupByCountryView(CPReportGroupByYearView):
    group_by = "country__name"
    group_pk = "country__id"
    order_by = "year"

    @staticmethod
    def get_group(obj):
        return obj.country.name

    @staticmethod
    def get_id(obj):
        return obj.country.id


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


class EmptyFormView(views.APIView):
    """
    API endpoint that allows to get empty form
    """

    def get_usages_tree(self, usage_id_dict):
        """
        Build usages tree structure from a list of usages
        ! make sure that the parrents are before the children in the list

        @param usage_id_dict: dict of usages (key: usage_id, value: usage object)

        @return: list of root nodes
        """
        root_nodes = []

        # Build the tree structure
        for usage in usage_id_dict.values():
            if usage.parent_id is None:
                root_nodes.append(usage)
            else:
                parent = usage_id_dict.get(usage.parent_id)
                # parrent should be before the child in the list so we can find it
                if getattr(parent, "children", None) is None:
                    parent.children = []
                parent.children.append(usage)

        return root_nodes

    def get_usage_columns(self, year):
        """
        Get usage columns for the given year

        @param year: int - year

        @return: dict of usage columns
            structure: {section: [Usage serialize data]}
        """
        # get all usages for the given year
        cp_report_formats = (
            CPReportFormat.objects.get_for_year(year)
            .select_related("usage")
            .order_by("section", "usage__sort_order")
        )
        # group usages by section
        section_usages = {}
        for cp_report_format in cp_report_formats:
            section = cp_report_format.section
            if section not in section_usages:
                section_usages[section] = {}
            section_usages[section][cp_report_format.usage_id] = cp_report_format.usage

        # get usages tree for each section
        usage_columns = {}
        for section, usages in section_usages.items():
            usage_tree = self.get_usages_tree(usages)
            key_name = f"section_{section.lower()}"

            usage_columns[key_name] = UsageSerializer(
                usage_tree, many=True, context={"for_year": year, "section": section}
            ).data

        return usage_columns

    def get_new_empty_form(self, year=None):
        # for now we return only the list of columns for usages
        if not year:
            year = datetime.now().year
        usage_columns = self.get_usage_columns(year)
        return Response({"usage_columns": usage_columns})

    def get_old_empty_form(self, cp_report):
        sections = {
            "usage_columns": self.get_usage_columns(cp_report.year),
            "admB": {
                "columns": [],
                "rows": [],
            },
            "admC": {
                "columns": [],
                "rows": [],
            },
            "admD": {
                "columns": [],
                "rows": [],
            },
        }

        # set columns
        # adm columns childrens are from the same time-frame as the parent
        # so it is enough to filter by the year only the parent columns
        columns = AdmColumn.objects.get_for_year(cp_report.year)
        for col in columns:
            serial_col = AdmColumnSerializer(col).data
            if col.section == AdmColumn.AdmColumnSection.B:
                sections["admB"]["columns"].append(serial_col)
            elif col.section == AdmColumn.AdmColumnSection.C:
                sections["admC"]["columns"].append(serial_col)

        # set rows
        rows = AdmRow.objects.get_for_cp_report(cp_report)

        # the rows with index 1.6.1 and 1.6.2 are special cases
        # if there is not a row with index 1.6.1 or 1.6.2 then we will display N/A
        admb_161 = False
        admb_162 = False
        for row in rows:
            serial_row = AdmRowSerializer(row).data
            if row.section == AdmRow.AdmRowSection.B:
                if row.index not in ["1.6.1", "1.6.2"]:
                    sections["admB"]["rows"].append(serial_row)
                    continue
                # row.index in ["1.6.1", "1.6.2"]
                if row.index == "1.6.1":
                    if row.text.lower() != "n/a":
                        # set admb_161 to True so we will not display 1.6.1 for N/A
                        admb_161 = True
                        sections["admB"]["rows"].append(serial_row)
                    elif not admb_161:
                        # row.text.lower() == "n/a" and admb_161 is False
                        sections["admB"]["rows"].append(serial_row)
                elif row.index == "1.6.2":
                    if row.text.lower() != "n/a":
                        # set admb_162 to True so we will not display 1.6.2 for N/A
                        admb_162 = True
                        sections["admB"]["rows"].append(serial_row)
                    elif not admb_162:
                        # row.text.lower() == "n/a" and admb_162 is False
                        sections["admB"]["rows"].append(serial_row)

            elif row.section == AdmRow.AdmRowSection.C:
                sections["admC"]["rows"].append(serial_row)
            elif row.section == AdmRow.AdmRowSection.D:
                sections["admD"]["rows"].append(serial_row)

        return Response(sections)

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
    def get(self, request, *args, **kwargs):
        cp_report_id = request.query_params.get(
            "cp_report_id",
        )
        cp_report = CPReport.objects.filter(id=cp_report_id).first()

        if cp_report and cp_report.year <= IMPORT_DB_MAX_YEAR:
            return self.get_old_empty_form(cp_report)

        year = cp_report.year if cp_report else None
        return self.get_new_empty_form(year)
