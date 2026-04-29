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
        project_fields = ProjectsInventoryReportWriter.get_project_fields()
        metaproject_fields = ProjectsInventoryReportWriter.get_metaproject_fields()
        # We need fk_fields and m2m_fields for ALL project fields, not just the selected ones,
        # because the base headers also rely on them. Otherwise, we hit an N+1 queries issue.
        fk_fields = ProjectsInventoryReportWriter.get_fk_fields(project_fields)
        m2m_fields = ProjectsInventoryReportWriter.get_m2m_fields(project_fields)
        queryset = (
            self.view.filter_queryset(self.view.get_queryset())
            .filter(version__gte=3)
            .select_related(
                *fk_fields,
                "funding_window__meeting",
            )
            .prefetch_related(
                *m2m_fields,
                "component__projects",
                Prefetch(
                    "archive_projects",
                    queryset=Project.objects.really_all().select_related(
                        "meeting",
                        "post_excom_meeting",
                        "status",
                    ),
                ),
            )
        )[:1000]
        version_map = {(p.final_version.id, p.version): p for p in queryset}
        writer = ProjectsInventoryReportWriter(
            self.sheet,
            version_map,
            project_fields=project_fields,
            metaproject_fields=metaproject_fields,
        )
        # Filter in memory to avoid a second DB query on the same large set.
        latest_projects = [p for p in queryset if p.latest_project_id is None]
        writer.write(latest_projects)
        timestamp = datetime.today().strftime("%Y.%m")
        return workbook_response(f"{timestamp} Inventory report", self.wb)
