from datetime import datetime
from typing import TYPE_CHECKING

import openpyxl
from django.db.models import Prefetch
from openpyxl.worksheet.worksheet import Worksheet

from core.api.export.base import configure_sheet_print
from core.api.export.projects_inventory_report import ProjectsInventoryReportWriter
from core.api.utils import workbook_response
from core.models import Project

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
            .select_related("lead_agency", "funding_window", "bp_activity")
            .prefetch_related(
                Prefetch(
                    "archive_projects",
                    queryset=Project.objects.really_all().select_related(
                        "meeting",
                        "post_excom_meeting",
                        "status",
                    ),
                )
            )
        )
        version_map = {(p.final_version.id, p.version): p for p in queryset}
        writer = ProjectsInventoryReportWriter(self.sheet, version_map)
        writer.write(queryset.filter(latest_project=None))
        timestamp = datetime.today().strftime("%Y.%m")
        return workbook_response(f"{timestamp} Inventory report", self.wb)
