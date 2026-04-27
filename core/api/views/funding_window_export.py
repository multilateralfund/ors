from datetime import datetime
from typing import TYPE_CHECKING

import openpyxl

from core.api.export.base import BaseWriter
from core.api.export.base import configure_sheet_print
from core.api.utils import workbook_response

if TYPE_CHECKING:
    from core.api.views.funding_window import FundingWindowExportView
    from openpyxl.worksheet.worksheet import Worksheet

HEADERS = [
    {
        "id": "meeting",
        "headerName": "Meeting number",
        "method": lambda r, h: r[h["id"]]["number"] if r[h["id"]] else "",
    },
    {
        "id": "decision",
        "headerName": "Decision number",
        "method": lambda r, h: r[h["id"]]["number"] if r[h["id"]] else "",
    },
    {
        "id": "description",
        "headerName": "Funding window description",
        "column_width": 40,
    },
    {
        "id": "amount",
        "headerName": "Funding window amount (US$)",
        "type": "number",
        "align": "right",
        "cell_format": "$###,###,##0.00#############",
    },
    {
        "id": "total_project_funding_approved",
        "headerName": "Total project funding approved (US$)",
        "type": "number",
        "align": "right",
        "cell_format": "$###,###,##0.00#############",
    },
    {
        "id": "balance",
        "headerName": "Balance (US$)",
        "type": "number",
        "align": "right",
        "cell_format": "$###,###,##0.00#############",
    },
    {
        "id": "remarks",
        "headerName": "Remarks",
        "column_width": 40,
    },
]


class FundingWindowWriter(BaseWriter):
    ROW_HEIGHT = 35
    COLUMN_WIDTH = 20
    header_row_start_idx = 1


class FundingWindowExport:
    wb: "openpyxl.Workbook"
    sheet: "Worksheet"
    view: "FundingWindowExportView"

    def __init__(self, view):
        self.view = view

    def setup_workbook(self):
        wb = openpyxl.Workbook()
        sheet = wb.active
        sheet.title = "Funding windows"
        configure_sheet_print(sheet, "landscape")
        self.wb = wb
        self.sheet = sheet

    def export_xls(self):
        self.setup_workbook()
        queryset = self.view.filter_queryset(self.view.get_queryset())
        data = self.view.get_serializer(queryset, many=True).data

        FundingWindowWriter(self.sheet, HEADERS).write(data)
        timestamp = datetime.today().strftime("%Y.%m")
        return workbook_response(f"{timestamp} Funding windows", self.wb)
