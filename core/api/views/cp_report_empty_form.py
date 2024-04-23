from datetime import date
from datetime import datetime
from django.db.models import Q
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import views
from rest_framework.response import Response


from core.api.permissions import IsUserAllowedCP
from core.api.serializers.adm import (
    AdmColumnSerializer,
    AdmRowSerializer,
)
from core.api.serializers.usage import UsageSerializer
from core.api.views.utils import get_cp_report_from_request
from core.models.adm import AdmColumn, AdmRow
from core.models.country_programme import (
    CPReport,
    CPReportFormatColumn,
    CPReportFormatRow,
)
from core.utils import IMPORT_DB_MAX_YEAR, IMPORT_DB_OLDEST_MAX_YEAR


class EmptyFormView(views.APIView):
    """
    API endpoint that allows to get empty form
    """

    permission_classes = [IsUserAllowedCP]

    @classmethod
    def get_usages_tree(cls, usage_id_dict):
        """
        Build usages tree structure from a list of usages
        ! make sure that the parents are before the children in the list

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
                # parent should be before the child in the list, so we can find it
                if getattr(parent, "children", None) is None:
                    parent.children = []
                parent.children.append(usage)

        return root_nodes

    @classmethod
    def get_usage_columns(cls, year):
        """
        Get usage columns for the given year

        @param year: int - year

        @return: dict of usage columns
            structure: {section: [Usage serialize data]}
        """
        # get all usages for the given year
        cp_report_formats = (
            CPReportFormatColumn.objects.get_for_year(year)
            .select_related("usage")
            .order_by("section", "sort_order")
        )
        # group usages by section
        section_usages = {}
        for cp_report_format in cp_report_formats:
            section = cp_report_format.section
            if section not in section_usages:
                section_usages[section] = {}
            usage = cp_report_format.usage
            # add headerName
            usage.header_name = cp_report_format.header_name
            section_usages[section][cp_report_format.usage_id] = usage

        # get the usage tree for each section
        usage_columns = {}
        for section, usages in section_usages.items():
            if year <= IMPORT_DB_OLDEST_MAX_YEAR:
                # for the oldest years we don't have the usages tree
                usage_tree = usages.values()
            else:
                usage_tree = cls.get_usages_tree(usages)
            key_name = f"section_{section.lower()}"

            usage_columns[key_name] = UsageSerializer(usage_tree, many=True).data

        return usage_columns

    @classmethod
    def get_substance_rows(cls, year):
        cp_report_rows = (
            CPReportFormatRow.objects.get_for_year(year)
            .select_related("substance__group", "blend")
            .prefetch_related("substance__excluded_usages", "blend__excluded_usages")
            .order_by("section", "sort_order")
        )
        substance_rows = {
            "section_a": [],
            "section_b": [],
            "section_c": [],
        }
        for row in cp_report_rows:
            # set special group for section C
            group_name = row.get_group_name()

            if row.section == "C" and row.substance:
                if "hfc" in row.substance.name.lower():
                    group_name = "HFCs"
                elif "hcfc" in row.substance.name.lower():
                    group_name = "HCFCs"
                else:
                    group_name = "Alternatives"
            if row.section == "C" and row.blend:
                group_name = "HFCs"
            chemical_name = (
                row.get_chemical_display_name()
                if row.section != "C"
                else row.get_chemical_name()
            )

            row_data = {
                "chemical_name": chemical_name,
                "substance_id": row.substance_id,
                "blend_id": row.blend_id,
                "group": group_name,
                "sort_order": row.sort_order,
                "excluded_usages": row.get_excluded_usages_list(),
                "chemical_note": row.get_chemical_note(),
            }
            section_key = f"section_{row.section.lower()}"
            substance_rows[section_key].append(row_data)

        for k in ["section_a", "section_b", "section_c"]:
            if len(substance_rows[k]) == 0:
                del substance_rows[k]

        return substance_rows

    @classmethod
    def get_new_empty_form(cls, year=None):
        # for now, we return only the list of columns for usages
        if not year:
            year = datetime.now().year
        usage_columns = cls.get_usage_columns(year)
        substance_rows = cls.get_substance_rows(year)
        return {
            "usage_columns": usage_columns,
            "substance_rows": substance_rows,
        }

    @classmethod
    def get_old_empty_form(cls, year, cp_report):
        sections = {
            "usage_columns": cls.get_usage_columns(year),
            "substance_rows": cls.get_substance_rows(year),
            "adm_b": {
                "columns": [],
                "rows": [],
            },
            "adm_c": {
                "columns": [],
                "rows": [],
            },
            "adm_d": {
                "columns": [],
                "rows": [],
            },
        }

        # set columns
        # adm columns children are from the same time-frame as the parent,
        # so it is enough to filter by the year only the parent columns
        columns = AdmColumn.objects.get_for_year(year)
        for col in columns:
            serial_col = AdmColumnSerializer(col, context={"year": year}).data
            if col.section == AdmColumn.AdmColumnSection.B:
                sections["adm_b"]["columns"].append(serial_col)
            elif col.section == AdmColumn.AdmColumnSection.C:
                sections["adm_c"]["columns"].append(serial_col)

        if not year:
            return sections

        # set rows
        rows = (
            AdmRow.objects.get_for_year(year)
            .filter(  # filter by cp_report
                Q(country_programme_report_id=cp_report.id)
                | Q(country_programme_report_id__isnull=True)
            )
            .prefetch_related("immutable_cells")
        )

        # the rows with index 1.6.1 and 1.6.2 are special cases
        # if there is not a row with index 1.6.1 or 1.6.2 then we will display N/A
        admb_161 = False
        admb_162 = False
        for row in rows:
            serial_row = AdmRowSerializer(row).data
            serial_row["excluded_columns"] = row.immutable_cells.values_list(
                "column_id", flat=True
            )
            if row.section == AdmRow.AdmRowSection.B:
                if row.index not in ["1.6.1", "1.6.2"]:
                    sections["adm_b"]["rows"].append(serial_row)
                    continue
                # row.index in ["1.6.1", "1.6.2"]
                if row.index == "1.6.1" and row.text.lower() != "n/a":
                    # set admb_161 to True so we will not display 1.6.1 for N/A
                    admb_161 = True
                    sections["adm_b"]["rows"].append(serial_row)
                    continue
                if row.index == "1.6.1" and not admb_161:
                    # row.text.lower() == "n/a" and admb_161 is False
                    sections["adm_b"]["rows"].append(serial_row)
                    continue
                if row.index == "1.6.2" and row.text.lower() != "n/a":
                    # set admb_162 to True so we will not display 1.6.2 for N/A
                    admb_162 = True
                    sections["adm_b"]["rows"].append(serial_row)
                    continue
                if row.index == "1.6.2" and not admb_162:
                    # row.text.lower() == "n/a" and admb_162 is False
                    sections["adm_b"]["rows"].append(serial_row)
                    continue
            elif row.section == AdmRow.AdmRowSection.C:
                sections["adm_c"]["rows"].append(serial_row)
            elif row.section == AdmRow.AdmRowSection.D:
                sections["adm_d"]["rows"].append(serial_row)

        return sections

    @classmethod
    def get_04_empty_form(cls, year):
        return {
            "usage_columns": cls.get_usage_columns(year),
            "substance_rows": cls.get_substance_rows(year),
        }

    @classmethod
    def get_data(cls, year, cp_report):
        if year <= IMPORT_DB_OLDEST_MAX_YEAR:
            return cls.get_04_empty_form(year)
        if year <= IMPORT_DB_MAX_YEAR:
            return cls.get_old_empty_form(year, cp_report)

        return cls.get_new_empty_form(year)

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
    def get(self, request, *args, **kwargs):
        cp_report = get_cp_report_from_request(self.request, CPReport)

        if not cp_report:
            year = request.query_params.get("year", date.today().year)
        else:
            year = cp_report.year

        return Response(self.get_data(year, cp_report))
