from datetime import datetime
from typing import TYPE_CHECKING

import openpyxl
from django.db.models import Prefetch
from openpyxl.worksheet.worksheet import Worksheet

from core.api.export.base import configure_sheet_print
from core.api.export.projects_inventory_report import MIN_PROJECT_VERSION
from core.api.export.projects_inventory_report import ProjectsInventoryReportWriter
from core.api.utils import workbook_response
from core.models import Project, ProjectOdsOdp
from core.models.annual_project_report import AnnualProjectReport

if TYPE_CHECKING:
    from core.api.views import ProjectV2ViewSet


class ProjectsInventoryReportExport:
    wb: "openpyxl.Workbook"
    sheet: "Worksheet"
    view: "ProjectV2ViewSet"

    def __init__(self, view):
        self.view = view

    def setup_workbook(self):
        wb = openpyxl.Workbook(write_only=True)
        sheet = wb.create_sheet("Projects")
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
        archive_projects_queryset = (
            Project.objects.really_all()
            .filter(version__gte=MIN_PROJECT_VERSION)
            .select_related(
                "post_excom_meeting",
                "status",
            )
        )
        queryset = (
            self.view.filter_queryset(self.view.get_queryset())
            .filter(
                version__gte=MIN_PROJECT_VERSION,
                latest_project__isnull=True,
            )
            .prefetch_related(None)
            .select_related(
                *fk_fields,
                "funding_window__meeting",
                "transferred_from__agency",
            )
            .prefetch_related(
                *m2m_fields,
                "component__projects",
                Prefetch(
                    "archive_projects",
                    queryset=archive_projects_queryset,
                ),
                Prefetch(
                    "ods_odp",
                    queryset=ProjectOdsOdp.objects.select_related(
                        "ods_substance",
                        "ods_blend",
                    ),
                ),
                Prefetch(
                    "annual_reports",
                    queryset=AnnualProjectReport.objects.filter(
                        report__progress_report__endorsed=True
                    )
                    .select_related("report__progress_report")
                    .order_by("-report__progress_report__year"),
                    to_attr="prefetched_endorsed_aprs",
                ),
            )
        )
        projects = list(queryset)
        writer = ProjectsInventoryReportWriter(
            self.sheet,
            projects,
            project_fields=project_fields,
            metaproject_fields=metaproject_fields,
        )
        writer.write(projects)
        timestamp = datetime.today().strftime("%Y.%m")
        return workbook_response(f"{timestamp} Inventory report", self.wb)
