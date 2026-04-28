from datetime import datetime
from typing import TYPE_CHECKING

import openpyxl
from openpyxl.worksheet.worksheet import Worksheet

from core.api.export.base import configure_sheet_print
from core.api.export.projects_inventory_report import ProjectsInventoryReportWriter
from core.api.utils import workbook_response

if TYPE_CHECKING:
    from core.api.views import ProjectV2ViewSet


class ProjectsInventoryReportExport:
    wb: "openpyxl.Workbook"
    sheet: "Worksheet"
    view: "ProjectV2ViewSet"

    def __init__(self, view):
        self.view = view

    def setup_workbook(self):
        wb = openpyxl.Workbook()
        sheet = wb.active
        sheet.title = "Projects"
        configure_sheet_print(sheet, "landscape")
        self.wb = wb
        self.sheet = sheet

    def export_xls(self):
        self.setup_workbook()
        queryset = (
            self.view.filter_queryset(self.view.get_queryset())
            .filter(version__gte=3)
            .select_related("lead_agency", "funding_window")
        )
        writer = ProjectsInventoryReportWriter(self.sheet)
        writer.write(queryset)
        timestamp = datetime.today().strftime("%Y.%m")
        return workbook_response(f"{timestamp} Inventory report", self.wb)
