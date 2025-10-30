import pathlib
from copy import copy

import openpyxl
from openpyxl.styles import Side, Border
from rest_framework import mixins
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.api.filters.project_approval_summary import ProjectApprovalSummaryFilter
from core.api.permissions import HasProjectV2ApproveAccess
from core.api.serializers.project_approval_summary import ApprovalSummarySerializer
from core.api.utils import workbook_response
from core.models import Project


class ProjectApprovalSummaryViewSet(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
):
    """ViewSet for approval summary."""

    filterset_class = ProjectApprovalSummaryFilter
    queryset = Project.objects.really_all()
    permission_classes = (HasProjectV2ApproveAccess,)

    _template_path = (
        pathlib.Path(__file__).parent.parent
        / "export"
        / "templates"
        / "approval_summary_template.xlsx"
    )

    def _extract_data(self):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = ApprovalSummarySerializer(queryset)
        return serializer.data

    def list(self, request, *args, **kwargs):
        return Response(self._extract_data())

    def _make_row(self, *disable):
        base = [
            "hcfc",
            "hfc",
            "project_funding",
            "project_support_cost",
            "total",
        ]
        return [None if v in disable else v for v in base]

    def _find_row(self, name, rows, offset=0):
        result = None
        for idx, value in enumerate(rows[offset:], start=offset + 1):
            if value == name:
                result = idx
                break
        return result

    def _write_section(self, name, sheet, rows, data, mapping):
        found_now = self._find_row(name, rows)
        for sector, options in mapping.items():
            idx = self._find_row(sector, rows, offset=found_now)
            writing_offset = None
            for c_idx, c in enumerate(sheet[idx], start=1):
                if c.value is not None and c.value.strip().lower() == sector:
                    writing_offset = c_idx
                    break
            if writing_offset is not None:
                data_from = data[options["data_key"]]
                for w_idx, c in enumerate(options["columns"], start=writing_offset):
                    if c is not None:
                        sheet[idx][w_idx].value = data_from.get(c) or None

    def _write_full_row(self, sheet, row_idx, name, data, col_offset=1):
        columns = self._make_row()
        sheet[row_idx][col_offset].value = name
        for w_idx, c in enumerate(columns, start=col_offset + 1):
            if c is not None:
                sheet[row_idx][w_idx].value = data[c]

    @staticmethod
    def _duplicate_row(
        sheet, target_idx, copy_source, border_top=False, col_size=6, col_offset=1
    ):
        sheet.insert_rows(target_idx)

        top_border = Border(top=Side(style="thin"))

        for idx, c in enumerate(
            copy_source[col_offset : col_size + 1], start=col_offset
        ):
            sheet[target_idx][idx].font = copy(c.font)
            sheet[target_idx][idx].number_format = copy(c.number_format)
            sheet[target_idx][idx].alignment = copy(c.alignment)
            if border_top:
                sheet[target_idx][idx].border = top_border
            else:
                sheet[target_idx][idx].border = copy(c.border)
            sheet[target_idx][idx].fill = copy(c.fill)

    @action(methods=["GET"], detail=False)
    def export(self, request, *args, **kwargs):
        wb = openpyxl.open(self._template_path)
        sheet = wb.worksheets[0]
        rows = [
            "".join(c.value for c in r if c.value).strip().lower() for r in sheet.rows
        ]
        data = self._extract_data()

        row_types = {
            "phase-out plan": {
                "data_key": "phase_out_plan",
                "columns": self._make_row(),
            },
            "destruction": {
                "data_key": "destruction",
                "columns": self._make_row(),
            },
            "several": {
                "data_key": "several",
                "columns": self._make_row(),
            },
            "hfc phase-down": {
                "data_key": "hfc_phase_down",
                "columns": self._make_row(),
            },
            "energy efficiency": {
                "data_key": "energy_efficiency",
                "columns": self._make_row(),
            },
            "total:": {
                "data_key": "total",
                "columns": self._make_row(),
            },
        }

        sections = [
            [
                "bilateral cooperation",
                "bilateral_cooperation",
                [
                    "phase-out plan",
                    "destruction",
                    "hfc phase-down",
                    "energy efficiency",
                    "total:",
                ],
            ],
            [
                "investment project",
                "investment_project",
                [
                    "phase-out plan",
                    "hfc phase-down",
                    "energy efficiency",
                    "total:",
                ],
            ],
            [
                "work programme amendment",
                "work_programme_amendment",
                [
                    "phase-out plan",
                    "destruction",
                    "several",
                    "hfc phase-down",
                    "energy efficiency",
                    "total:",
                ],
            ],
        ]

        for sector, data_key, section_rows in sections:
            self._write_section(
                sector,
                sheet,
                rows,
                data[data_key],
                {k: row_types[k] for k in section_rows},
            )

        grand_total_agency = copy(data["grand_total"])
        grand_total_agency["agency_name"] = "GRAND TOTAL (HCFCs and HFCs)"
        grand_total_agency["agency_type"] = "GT"

        agencies = list(data["summary_by_parties_and_implementing_agencies"]) + [
            grand_total_agency
        ]

        agencies_row_idx = self._find_row(
            "summary by parties and implementing agencies", rows
        )
        copy_from = sheet[agencies_row_idx + 1]

        for a_idx, agency in enumerate(agencies):
            agencies_row_idx += 1

            is_first_agency = (
                agencies[a_idx - 1]["agency_type"] == "National"
                and agency["agency_type"] == "Agency"
            )
            self._duplicate_row(
                sheet, agencies_row_idx, copy_from, border_top=is_first_agency
            )
            self._write_full_row(sheet, agencies_row_idx, agency["agency_name"], agency)

        sheet.delete_rows(agencies_row_idx + 1, 10)

        return workbook_response("Approval summary meeting", wb)
