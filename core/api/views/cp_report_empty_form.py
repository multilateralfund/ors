from datetime import datetime
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import views
from rest_framework.response import Response

from core.api.serializers.adm import (
    AdmColumnSerializer,
    AdmRowSerializer,
)
from core.api.serializers.usage import UsageSerializer
from core.models.adm import AdmColumn, AdmRow
from core.models.country_programme import (
    CPReport,
    CPReportFormat,
)
from core.utils import IMPORT_DB_MAX_YEAR


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
