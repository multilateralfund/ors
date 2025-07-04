from typing import List

import openpyxl

from core.api.serializers.project_v2 import ProjectDetailsV2Serializer
from core.api.serializers.business_plan import BPActivityExportSerializer

from core.models.project import Project
from core.models.business_plan import BPActivity
from core.models.project_metadata import ProjectSpecificFields
from core.models.project_metadata import ProjectField

from core.api.export.base import configure_sheet_print, WriteOnlyBase
from core.api.export.business_plan import BPActivitiesWriter

from core.api.utils import workbook_response


def get_headers_identifiers():
    return [
        {
            "id": "country",
            "headerName": "Country",
        },
        {
            "id": "meeting",
            "headerName": "Meeting number",
        },
        {
            "id": "agency",
            "headerName": "Agency",
        },
        {
            "id": "cluster",
            "headerName": "Cluster",
            "method": lambda r, h: r[h["id"]]["name"],
            "column_width": WriteOnlyBase.COLUMN_WIDTH * 1.5,
        },
        {
            "id": "submission_status",
            "headerName": "Submission status",
        },
    ]


def get_headers_bp():
    return []


def get_headers_cross_cutting():
    return [
        {
            "id": "title",
            "headerName": "Title",
        },
        {
            "id": "description",
            "headerName": "Description",
        },
        {
            "id": "project_type",
            "headerName": "Type",
            "method": lambda r, h: r[h["id"]]["name"],
        },
        {
            "id": "sector",
            "headerName": "Sector",
            "method": lambda r, h: r[h["id"]]["name"],
        },
        {
            "id": "subsectors",
            "headerName": "Subsectors",
            "method": lambda r, h: ", ".join(ss["name"] for ss in r[h["id"]]),
            "column_width": WriteOnlyBase.COLUMN_WIDTH * 1.5,
        },
        {
            "id": "is_lvc",
            "headerName": "LVC/Non-LVC",
            "method": lambda r, h: r[h["id"]] and "LVC" or "Non-LVC",
            "column_width": WriteOnlyBase.COLUMN_WIDTH * 1.5,
        },
        {
            "id": "total_fund",
            "headerName": "Project funding",
        },
        {
            "id": "support_cost_psc",
            "headerName": "Project support cost",
        },
        {
            "id": "project_start_date",
            "headerName": "Project start date",
        },
        {
            "id": "project_end_date",
            "headerName": "Project end date",
        },
    ]


def get_headers_specific_information(fields: List[ProjectField]):
    result = []

    for field in fields:
        result.append({"id": field.read_field_name, "headerName": field.label})

    return result


def get_headers_impact():
    return [
        {
            "id": "total_number_of_nou_personnnel_supported",
            "headerName": "Total number of NOU personnel supported",
        },
        {
            "id": "number_of_female_nou_personnel_supported",
            "headerName": "Number of female NOU personnel supported",
        },
    ]


class ProjectsV2ProjectExport:
    wb: openpyxl.Workbook
    project: Project

    def __init__(self, project_id):
        self.project = Project.objects.get(pk=project_id)
        self.setup_workbook()

    def setup_workbook(self):
        wb = openpyxl.Workbook()
        # delete default sheet
        del wb[wb.sheetnames[0]]
        self.wb = wb

    def build_identifiers(self, data):
        sheet = self.add_sheet("Identifiers")
        WriteOnlyBase(sheet, get_headers_identifiers()).write([data])

    def build_bp(self, data):
        if data["bp_activity"]:
            activity = BPActivity.objects.get(id=data["bp_activity"])
        else:
            return
        sheet = self.add_sheet("Identifiers - BP Activity")

        data = BPActivityExportSerializer(activity).data
        writer = BPActivitiesWriter(self.wb, min_year=None, max_year=None)
        del self.wb[writer.sheet.title]
        writer.sheet = sheet
        writer.write([data])

    def build_cross_cutting(self, data):
        sheet = self.add_sheet("Cross-cutting")
        WriteOnlyBase(sheet, get_headers_cross_cutting()).write([data])

    def build_specific_information(self, data):
        project_specific_fields_obj = ProjectSpecificFields.objects.filter(
            cluster=self.project.cluster,
            type=self.project.project_type,
            sector=self.project.sector,
        ).first()

        fields = project_specific_fields_obj.fields.filter(section__in=["Header"])
        if fields:
            sheet = self.add_sheet("Specific information - Overview")
            WriteOnlyBase(
                sheet,
                get_headers_specific_information(fields),
            ).write([data])

        fields = project_specific_fields_obj.fields.filter(
            section__in=["Substance Details"]
        )
        if fields:
            sheet = self.add_sheet("Specific information - Substance details")
            WriteOnlyBase(
                sheet,
                get_headers_specific_information(fields),
            ).write(data.get("ods_odp", []))

        fields = project_specific_fields_obj.fields.filter(section__in=["Impact"])
        if fields:
            sheet = self.add_sheet("Impact")
            WriteOnlyBase(
                sheet,
                get_headers_specific_information(fields),
            ).write([data])

    def build_impact(self, data):
        sheet = self.add_sheet("Impact")
        WriteOnlyBase(sheet, get_headers_impact()).write([data])

    def build_xls(self):
        serializer = ProjectDetailsV2Serializer(self.project)
        data = serializer.data
        self.build_identifiers(data)
        self.build_bp(data)
        self.build_cross_cutting(data)
        self.build_specific_information(data)
        self.build_impact(data)

    def add_sheet(self, name):
        sheet = self.wb.create_sheet(name)
        configure_sheet_print(sheet, "landscape")
        return sheet

    def export_xls(self):
        self.build_xls()
        return workbook_response(f"Project {self.project.id}", self.wb)
