from typing import Annotated

import openpyxl

from core.api.export.base import BaseWriter
from core.api.export.base import configure_sheet_print
from core.api.export.business_plan import BPActivitiesWriter
from core.api.export.single_project_v2.xlsx_headers import get_headers_cross_cutting
from core.api.export.single_project_v2.xlsx_headers import get_headers_identifiers
from core.api.export.single_project_v2.xlsx_headers import (
    get_headers_specific_information,
)
from core.api.export.single_project_v2.helpers import get_activity_data
from core.api.serializers.project_v2 import ProjectDetailsV2Serializer
from core.api.utils import workbook_response
from core.models import Project
from core.models import ProjectSpecificFields


class ProjectWriter(BaseWriter):
    header_row_start_idx = 1
    COLUMN_WIDTH = 20


class ProjectsV2ProjectExport:
    wb: openpyxl.Workbook
    project: Project

    def __init__(self, project):
        self.project = project
        self.setup_workbook()

    def setup_workbook(self):
        wb = openpyxl.Workbook()
        # delete default sheet
        del wb[wb.sheetnames[0]]
        self.wb = wb

    def build_identifiers(self, data):
        sheet = self.add_sheet("Identifiers")
        ProjectWriter(sheet, get_headers_identifiers()).write([data])

    def build_bp(self, data):
        activity_data = get_activity_data(data)
        if activity_data:
            sheet = self.add_sheet("Identifiers - BP Activity")
            writer = BPActivitiesWriter(self.wb, min_year=None, max_year=None)
            # The BPActivitiesWriter creates a sheet that we don't need, replace it with our own
            del self.wb[writer.sheet.title]
            writer.sheet = sheet
            writer.write([activity_data])

    def build_cross_cutting(self, data):
        sheet = self.add_sheet("Cross-cutting")
        ProjectWriter(sheet, get_headers_cross_cutting()).write([data])

    def _write_project_specific_fields(
        self,
        fields_obj: ProjectSpecificFields,
        fields_section: str,
        sheet_name: Annotated[str, "max_length=31"],
        data,
    ):
        """
        Writes a new sheet.

        :param sheet_name: The sheet name should not exceed 31 characters, this is as Excel constraint.
        """
        fields = fields_obj.fields.filter(section__in=[fields_section]).exclude(
            read_field_name="sort_order"
        )
        if fields:
            sheet = self.add_sheet(sheet_name)
            ProjectWriter(
                sheet,
                get_headers_specific_information(fields),
            ).write(data)

    def build_specific_information(self, data):
        project_specific_fields_obj = ProjectSpecificFields.objects.filter(
            cluster=self.project.cluster,
            type=self.project.project_type,
            sector=self.project.sector,
        ).first()

        if project_specific_fields_obj:
            self._write_project_specific_fields(
                project_specific_fields_obj,
                "Header",
                "SI - Overview",
                [data],
            )

            self._write_project_specific_fields(
                project_specific_fields_obj,
                "Substance Details",
                "SI - Substance details",
                [
                    {**d, "products_manufactured": data.get("products_manufactured")}
                    for d in data.get("ods_odp", [])
                ],
            )

            self._write_project_specific_fields(
                project_specific_fields_obj,
                "Impact",
                "Impact",
                [data],
            )

    def build_xls(self):
        serializer = ProjectDetailsV2Serializer(self.project)
        data = serializer.data
        self.build_identifiers(data)
        self.build_bp(data)
        self.build_cross_cutting(data)
        self.build_specific_information(data)

    def add_sheet(self, name):
        sheet = self.wb.create_sheet(name)
        configure_sheet_print(sheet, "landscape")
        return sheet

    def export_xls(self):
        self.build_xls()
        return workbook_response(f"Project {self.project.id}", self.wb)
