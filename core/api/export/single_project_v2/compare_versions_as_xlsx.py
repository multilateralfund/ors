from itertools import chain
import openpyxl

from django.db.models import QuerySet

from core.models import Project
from core.models import ProjectField
from core.models import ProjectSpecificFields

from core.api.serializers.project_v2 import ProjectDetailsV2Serializer

from core.api.utils import workbook_response
from core.api.export.base import configure_sheet_print
from core.api.export.projects_v2_dump import ProjectsV2Dump

from core.api.export.single_project_v2.xlsx_headers import get_headers_cross_cutting
from core.api.export.single_project_v2.xlsx_headers import (
    get_headers_specific_information,
)


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


def serialize_project(p):
    serializer = ProjectDetailsV2Serializer(p)
    return serializer.data


def version_label(p):
    return p.submission_status.name


class CompareVersionsWriter:
    def __init__(self, sheet, project):
        self.sheet = sheet
        self.project = project

    def write(self, user, projects: QuerySet[Project]):
        p1, p2 = [p for p in projects][:2]
        d1, d2 = serialize_project(p1), serialize_project(p2)
        l1, l2 = version_label(p1), version_label(p2)
        headers = [h["headerName"] for h in HEADER]

        value_headers = self.get_other_headers(
            self.get_fields(user),
            self.get_specific_information_fields(user),
            exclude=[h["id"].split(".")[0] for h in HEADER],
        )
        for f in value_headers:
            headers.append(f["headerName"])
            headers.append(f["headerName"])
            headers.append(f["headerName"])

        self.sheet.append(headers)
        data = []

        for h in HEADER:
            data.append(self.get_value(h["id"]))

        print([repr(x) for x in data])

        for h in value_headers:
            print(h["id"])
            v1 = h["method"](d1, h) if h.get("method") else self.get_value(h["id"], p1)
            v2 = h["method"](d2, h) if h.get("method") else self.get_value(h["id"], p2)
            variance = None

            if v1 and v2:
                try:
                    variance = v2 - v1
                except TypeError:
                    pass

            if v1 or v2:
                print(h["id"], repr(v1), repr(v2))
            data.extend(
                [
                    v1,
                    v2,
                    variance,
                ]
            )

        self.sheet.append(data)

    def get_fields(self, user):
        return ProjectField.objects.get_visible_fields_for_user(user).exclude(
            read_field_name="sort_order"
        )

    def get_specific_information_fields(self, user):
        return (
            ProjectSpecificFields.objects.filter(
                cluster=self.project.cluster,
                type=self.project.project_type,
                sector=self.project.sector,
            )
            .first()
            .fields.get_visible_fields_for_user(user)
            .exclude(read_field_name="sort_order")
        )

    def get_other_headers(self, fields, specific_fields, exclude=tuple()):
        print(exclude)
        return [
            x
            for x in chain(
                get_headers_cross_cutting(fields),
                get_headers_specific_information(specific_fields),
            )
            if x["id"] not in exclude
        ]

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

    def __init__(self, user, project: Project, queryset: QuerySet[Project]):
        self.user = user
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
        CompareVersionsWriter(self.sheet, self.project).write(self.user, self.queryset)
        filename = (
            f"Compare versions = {'_'.join([str(p.id) for p in self.queryset])}.xlsx"
        )
        return workbook_response(filename, self.wb)
