from functools import lru_cache
from functools import partial
from itertools import chain
from time import time

import openpyxl
from django.db.models import JSONField
from django.db.models import Prefetch
from django.db.models.fields import BooleanField
from django.db.models.fields import CharField
from django.db.models.fields import DateField
from django.db.models.fields import DateTimeField
from django.db.models.fields.related import ForeignKey
from django.db.models.fields.related import ManyToManyField
from django.db.models.fields.reverse_related import ForeignObjectRel

from core.api.export.base import configure_sheet_print
from core.api.export.single_project_v2.helpers import format_iso_date
from core.api.serializers.project_v2 import ProjectV2OdsOdpSerializerMethods
from core.api.utils import workbook_response
from core.models import Project
from core.models import ProjectOdsOdp
from core.models.project import OLD_FIELD_HELP_TEXT
from core.models.project_metadata import ProjectField


def get_field_value(project, header):
    field_name = header["id"]
    return getattr(project, field_name, "")


def get_value_date(project, header):
    value = get_field_value(project, header)
    return format_iso_date(value)


def get_value_boolean(project, header):
    value = get_field_value(project, header)

    if value is True:
        return "Yes"

    if value is False:
        return "No"

    if not value:
        return ""

    return value


def get_choice_value(choices, project, header):
    value = get_field_value(project, header)
    if value:
        return choices.get(value, value)
    return ""


def get_value_fk(_f, project, header, attr_name="name"):
    value = get_field_value(project, header)
    if value:
        try:
            return getattr(value, attr_name)
        except AttributeError:
            return str(value)
    return ""


def get_value_m2m(_f, project, header):
    value = get_field_value(project, header)
    if value:
        values = value.values()
        if values:
            return ", ".join(v.get("name", str(v)) for v in values)
    return ""


def get_value_component_field(project, header):
    value = get_field_value(project, header)
    if value:
        return ", ".join(str(p.id) for p in value.projects.all())
    return ""


class ProjectsOdsOdpWriter:
    def __init__(self, sheet):
        self.sheet = sheet
        self.headers = self.get_headers()
        self.project_headers = self.get_project_headers()
        self.sheet.append(
            [h["headerName"] for h in chain(self.project_headers, self.headers)]
        )
        self._ids_project = [h["id"] for h in self.project_headers]
        self._ids_odsodp = [h["id"] for h in self.headers]

    def write(self, p):
        base_row = [getattr(p, i) for i in self._ids_project]
        for odsodp in p.ods_odp.all():
            row = base_row.copy()
            for i in self._ids_odsodp:
                if hasattr(ProjectV2OdsOdpSerializerMethods, i):
                    row.append(getattr(ProjectV2OdsOdpSerializerMethods, i)(odsodp))
                elif hasattr(odsodp, i):
                    row.append(getattr(odsodp, i))
                else:
                    row.append(getattr(p, i))
            self.sheet.append(row)

    def get_project_headers(self):
        return [
            {
                "id": "id",
                "headerName": "Project ID",
            },
            {
                "id": "version",
                "headerName": "Project version",
            },
            {
                "id": "code",
                "headerName": "Project code",
            },
            {
                "id": "legacy_code",
                "headerName": "Project legacy code",
            },
        ]

    def get_headers(self):
        fields = (
            ProjectField.objects.filter(table="ods_odp")
            .exclude(read_field_name="sort_order")
            .order_by("sort_order")
            .values("read_field_name", "label")
        )
        return [
            {
                "id": f["read_field_name"],
                "headerName": f["label"],
            }
            for f in fields
        ]


class ProjectsV2DumpWriter:
    def __init__(self, sheet, fields):
        self.sheet = sheet
        self.headers = list(self._build_headers(fields))

    def write(self, queryset, with_project):
        self.sheet.append([h["headerName"] for h in self.headers])
        for p in queryset.iterator(chunk_size=1000):
            self.sheet.append([h["method"](p, h) for h in self.headers])
            with_project(p)

    def _build_headers(self, fields):
        field_names = {
            f["write_field_name"]: f["label"]
            for f in ProjectField.objects.filter(
                write_field_name__in=[f.name for f in fields],
            ).values("write_field_name", "label")
        }
        for f in fields:
            header = {
                "id": f.name,
                "headerName": field_names.get(f.name, f.name),
                "method": get_field_value,
            }
            if isinstance(f, DateField):
                header["method"] = get_value_date
            elif isinstance(f, DateTimeField):
                header["method"] = get_value_date
            elif isinstance(f, BooleanField):
                header["method"] = get_value_boolean
            elif isinstance(f, CharField) and f.choices:
                header["method"] = partial(get_choice_value, dict(f.choices))
            elif isinstance(f, JSONField):
                continue
            elif isinstance(f, ForeignKey):
                if f.name == "component":
                    header["method"] = get_value_component_field
                elif f.name == "bp_activity":
                    header["method"] = partial(
                        get_value_fk, f, attr_name="get_display_internal_id"
                    )
                else:
                    header["method"] = partial(get_value_fk, f)
            elif isinstance(f, ManyToManyField):
                header["method"] = partial(get_value_m2m, f)

            yield header


class ProjectsV2Dump:
    def __init__(self, view):
        self.view = view
        queryset = (
            Project.objects.really_all()
            .select_related(*self.get_fk_fields())
            .prefetch_related(
                *self.get_m2m_fields(),
                Prefetch(
                    "ods_odp",
                    queryset=ProjectOdsOdp.objects.all().select_related(
                        "ods_substance", "ods_blend"
                    ),
                ),
            )
        )
        self.queryset = self.view.filter_queryset(queryset)
        self.setup_workbook()

    def _make_sheet(self, title):
        sheet = self.wb.create_sheet(title)
        configure_sheet_print(sheet, "landscape")
        return sheet

    def setup_workbook(self):
        wb = openpyxl.Workbook(write_only=True)
        self.wb = wb
        self.sheet_projects = self._make_sheet("Projects")
        self.sheet_substances = self._make_sheet("Substances")

    def get_fk_fields(self):
        return (f.name for f in self.get_valid_fields() if isinstance(f, ForeignKey))

    def get_m2m_fields(self):
        return (
            f.name for f in self.get_valid_fields() if isinstance(f, ManyToManyField)
        )

    @lru_cache
    def get_valid_fields(self):
        old_fields_included = [
            "additional_funding",
            "date_comp_revised",
        ]
        non_reverse = (
            f for f in Project._meta.get_fields() if not isinstance(f, ForeignObjectRel)
        )
        non_old = (
            f
            for f in non_reverse
            if (
                getattr(f, "help_text", None) != OLD_FIELD_HELP_TEXT
                or f.name in old_fields_included
            )
        )
        return list(non_old)

    def export(self):
        t0 = time()
        odp_writer = ProjectsOdsOdpWriter(self.sheet_substances)
        ProjectsV2DumpWriter(self.sheet_projects, self.get_valid_fields()).write(
            self.queryset,
            odp_writer.write,
        )
        print(f"Done in {time() - t0:.2f} seconds.")
        return workbook_response("Projects database dump", self.wb)
