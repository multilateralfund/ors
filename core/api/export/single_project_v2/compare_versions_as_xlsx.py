import openpyxl

from django.db.models import QuerySet
from django.db.models.fields import DecimalField
from django.db.models.fields import FloatField

from core.models import Project

from core.api.utils import workbook_response
from core.api.export.base import configure_sheet_print
from core.api.export.projects_v2_dump import ProjectsV2Dump


HEADER = [
    {"id": "metacode", "headerName": "MYA Metacode"},
    {"id": "code", "headerName": "Project Code"},
    {"id": "country.name", "headerName": "Country"},
    {"id": "agency.name", "headerName": "Agency"},
    {"id": "cluster.name", "headerName": "Cluster"},
    {"id": "sector.name", "headerName": "Sector"},
    {"id": "subsectors.name", "headerName": "Subsector"},
    {"id": "title", "headerName": "Title"},
]


def decimal_fields(fields):
    for f in fields:
        if isinstance(f, (DecimalField, FloatField)):
            print(f.name)
            yield f


def version_label(p):
    return p.submission_status.name


class CompareVersionsWriter:
    def __init__(self, sheet, project):
        self.sheet = sheet
        self.project = project
        self.fields = ProjectsV2Dump.get_valid_fields()
        self.decimal_fields = list(decimal_fields(self.fields))

    def write(self, projects: QuerySet[Project]):
        p1, p2 = [p for p in projects][:2]
        l1, l2 = version_label(p1), version_label(p2)
        headers = [h["headerName"] for h in HEADER]
        for f in self.decimal_fields:
            name = getattr(f, "help_text", f.name) or f.name
            headers.extend(
                [
                    f"{name} - {l1}",
                    f"{name} - {l2}",
                    f"{name} - variance",
                ]
            )
        self.sheet.append(headers)
        data = []

        for h in HEADER:
            data.append(self.get_value(h["id"]))

        for f in self.decimal_fields:
            v1 = self.get_value(f.name, p1)
            v2 = self.get_value(f.name, p2)
            variance = None

            if v1 and v2:
                variance = v2 - v1

            data.extend(
                [
                    v1,
                    v2,
                    variance,
                ]
            )

        self.sheet.append(data)

    def get_value(self, name, project=None):
        project = project if project else self.project
        last = None
        for n in name.split("."):
            if not last:
                last = getattr(project, n, None)
                continue

            if isinstance(last, (tuple, list, set)):
                last = [getattr(x, n) for x in last]
            elif isinstance(last, dict):
                last = last.get(n)
            else:
                last = getattr(last, n)
        return last


class CompareVersionsProjectExport:
    wb: openpyxl.Workbook
    project: Project
    queryset: QuerySet[Project]

    def __init__(self, project: Project, queryset: QuerySet[Project]):
        self.queryset = queryset
        self.project = project
        self.setup_workbook()

    def setup_workbook(self):
        wb = openpyxl.Workbook()
        # delete default sheet
        del wb[wb.sheetnames[0]]
        sheet = wb.create_sheet("Comparison of versions")
        configure_sheet_print(sheet, "landscape")
        self.wb = wb
        self.sheet = sheet

    def export(self):
        CompareVersionsWriter(self.sheet, self.project).write(self.queryset)
        filename = (
            f"Compare versions = {'_'.join([str(p.id) for p in self.queryset])}.xlsx"
        )
        return workbook_response(filename, self.wb)
