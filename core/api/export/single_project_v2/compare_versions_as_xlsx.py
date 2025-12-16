from itertools import chain

import openpyxl

from openpyxl.styles import DEFAULT_FONT
from openpyxl.styles import Alignment
from openpyxl.styles import Font

from django.db.models import QuerySet

from core.models import Project
from core.models import ProjectField
from core.models import ProjectSpecificFields

from core.api.serializers.project_v2 import ProjectDetailsV2Serializer

from core.api.utils import workbook_response
from core.api.export.base import configure_sheet_print


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
        p1, p2 = list(projects)
        d1, d2 = serialize_project(p1), serialize_project(p2)
        l1, l2 = version_label(p1), version_label(p2)
        headers = [h["headerName"] for h in HEADER]

        value_headers = self.get_other_headers(
            self.get_fields(user),
            self.get_specific_information_fields(user),
            exclude=[h["id"].split(".", maxsplit=1)[0] for h in HEADER],
        )
        for f in value_headers:
            headers.append(f["headerName"])
            headers.extend([None, None])

        self.sheet.append(headers)
        for i in range(len(HEADER) + 1, len(HEADER) + (len(value_headers) * 3) + 1, 3):
            self.sheet.merge_cells(
                start_row=1, start_column=i, end_row=1, end_column=i + 2
            )

        self.sheet.append(
            [h["headerName"] for h in HEADER]
            + ([l1, l2, "Variance"] * len(value_headers))
        )
        for i in range(len(HEADER)):
            self.sheet.merge_cells(
                start_row=1, start_column=i + 1, end_row=2, end_column=i + 1
            )

        self.mark_header_rows(headers)

        data = []

        for h in HEADER:
            data.append(self.get_value(h["id"]))

        for h in value_headers:
            v1 = h["method"](d1, h) if h.get("method") else self.get_value(h["id"], d1)
            v2 = h["method"](d2, h) if h.get("method") else self.get_value(h["id"], d2)
            variance = None

            if v1 or v2:
                print(h["id"], v1, v2)

            if v1 and v2:
                try:
                    variance = abs(v2 - v1)
                except TypeError:
                    pass

            data.extend(
                [
                    v1,
                    v2,
                    variance,
                ]
            )

        self.sheet.append(data)

    def mark_header_rows(self, headers):
        for i in range(1, len(headers) + 1):
            for j in range(1, 3):
                cell = self.sheet.cell(j, i)
                cell.font = Font(name=DEFAULT_FONT.name, bold=True, color=None)
                cell.alignment = Alignment(
                    horizontal="center", vertical="center", wrap_text=True
                )

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

    def get_other_headers(self, fields, specific_fields, exclude=None):
        result = []

        known_ids = []
        exclude = exclude if exclude else []

        all_fields = sorted(
            chain(fields, specific_fields), key=lambda x: (x.section, x.sort_order)
        )
        for f in all_fields:
            if f.read_field_name in exclude:
                continue
            if f.read_field_name in known_ids:
                continue
            path = (
                f"{f.table}.{f.read_field_name}"
                if f.table != "project"
                else f.read_field_name
            )
            result.append(
                {
                    "id": path,
                    "headerName": (
                        f"{f.section}: {f.label}" if f.section != "Header" else f.label
                    ),
                }
            )
            known_ids.append(f.read_field_name)

        return result

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
                last = getattr(last, n, None)
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
