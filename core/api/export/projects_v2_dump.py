from functools import cached_property
from functools import partial
from itertools import chain
from time import time
from typing import Sequence

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
from core.models import MetaProject
from core.models import Project
from core.models import ProjectOdsOdp
from core.models.project import OLD_FIELD_HELP_TEXT
from core.models.project_metadata import ProjectField


def get_field_value(project, header):
    field_name = header["id"]
    context = project
    source = header.get("source")
    if source:
        context = getattr(project, source, project)

    return getattr(context, field_name, "")


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


class SheetWriter:
    def __init__(self, sheet):
        self.sheet = sheet
        self.sheet.append(
            [h["headerName"] for h in chain(self.project_headers, self.headers)]
        )

    @property
    def headers(self) -> Sequence[dict]:
        """Subclasses need to implement this."""
        raise NotImplementedError

    @cached_property
    def header_ids(self):
        return [h["id"] for h in self.headers]

    @cached_property
    def project_headers(self):
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
                "id": "latest_project_id",
                "headerName": "Is latest version",
                "method": lambda p, h: bool(getattr(p, h["id"])),
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

    def get_base_row(self, p):
        base_row = []
        for h in self.project_headers:
            method = h.get("method", lambda p, h: getattr(p, h["id"]))
            base_row.append(method(p, h))
        return base_row


class ProjectsFundsWriter(SheetWriter):
    @staticmethod
    def calc_total_fund(p, _):
        result = None
        if p.version == 3:
            result = p.total_fund
        elif p.version > 3:
            prev_version = p.get_version(p.version - 1)
            if prev_version:
                result = p.total_fund - prev_version.total_fund
        return result

    @staticmethod
    def calc_support_cost_psc(p, _):
        result = None
        if p.version == 3:
            result = p.support_cost_psc
        elif p.version > 3:
            prev_version = p.get_version(p.version - 1)
            if prev_version:
                result = p.support_cost_psc - prev_version.support_cost_psc
        return result

    @property
    def headers(self):
        return []

    @property
    def project_headers(self):
        headers = super().project_headers.copy()
        headers.extend(
            [
                {
                    "id": "total_fund_calc",
                    "headerName": "Funds approved",
                    "method": self.calc_total_fund,
                },
                {
                    "id": "support_cost_psc_calc",
                    "headerName": "PSC approved",
                    "method": self.calc_support_cost_psc,
                },
                {
                    "id": "total_fund",
                    "headerName": "Total funds",
                },
                {
                    "id": "support_cost_psc",
                    "headerName": "Support cost",
                },
                {
                    "id": "meeting",
                    "headerName": "Meeting ID",
                    "method": lambda p, _: p.meeting.id,
                },
                {
                    "id": "post_excom_meeting",
                    "headerName": "Post ExCom meeting ID",
                    "method": lambda p, _: (
                        p.post_excom_meeting.id if p.post_excom_meeting else None
                    ),
                },
                {
                    "id": "date_approved",
                    "headerName": "Date approved",
                },
            ]
        )
        return headers

    def write(self, p):
        base_row = self.get_base_row(p)
        self.sheet.append(base_row)


class ProjectsMeetingUpdatesWriter(SheetWriter):
    @property
    def headers(self):
        return []

    @property
    def project_headers(self):
        headers = super().project_headers.copy()
        headers.extend(
            [
                {
                    "id": "meeting",
                    "headerName": "Meeting approved",
                    "method": lambda p, _: p.meeting.id,
                },
                {
                    "id": "post_excom_meeting",
                    "headerName": "Post ExCom meeting ID",
                    "method": lambda p, _: (
                        p.post_excom_meeting.id if p.post_excom_meeting else None
                    ),
                },
            ]
        )
        return headers

    def write(self, p):
        base_row = self.get_base_row(p)
        self.sheet.append(base_row)


class ProjectsOdsOdpWriter(SheetWriter):
    def write(self, p):
        base_row = self.get_base_row(p)

        for odsodp in p.ods_odp.all():
            row = base_row.copy()
            for i in self.header_ids:
                if hasattr(ProjectV2OdsOdpSerializerMethods, i):
                    row.append(getattr(ProjectV2OdsOdpSerializerMethods, i)(odsodp))
                elif hasattr(odsodp, i):
                    row.append(getattr(odsodp, i))
                else:
                    row.append(getattr(p, i))
            self.sheet.append(row)

    @cached_property
    def headers(self):
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
    def __init__(self, sheet, project_fields, metaproject_fields):
        self.sheet = sheet
        project_headers = self._build_headers(project_fields)
        metaproject_headers = self._build_headers(
            metaproject_fields, source="meta_project"
        )
        self.headers = project_headers[:2] + metaproject_headers + project_headers[2:]

    def write(self, queryset, *with_project):
        self.sheet.append([h["headerName"] for h in self.headers])
        for p in queryset.iterator(chunk_size=1000):
            self.sheet.append([h["method"](p, h) for h in self.headers])
            for writer in with_project:
                writer(p)

    def _build_headers(self, fields, source=None):
        result = []
        field_names = {
            f["write_field_name"]: f["label"]
            for f in ProjectField.objects.filter(
                write_field_name__in=[f.name for f in fields],
            ).values("write_field_name", "label")
        }
        for f in fields:
            header_name = field_names.get(f.name)
            if not header_name and f.help_text:
                header_name = f"{f.name} ({f.help_text})"
            else:
                header_name = f.name
            header = {
                "id": f.name,
                "headerName": header_name,
                "method": get_field_value,
                "source": source,
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

            result.append(header)
        return result


class ProjectsV2Dump:
    def __init__(self, view):
        self.view = view
        self.project_fields = self.get_project_fields()
        self.metaproject_fields = self.get_metaproject_fields(["end_date"])
        queryset = (
            Project.objects.really_all()
            .select_related(*self.get_fk_fields(self.project_fields))
            .prefetch_related(
                *self.get_m2m_fields(self.project_fields),
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

    @staticmethod
    def get_fk_fields(fields):
        return (f.name for f in fields if isinstance(f, ForeignKey))

    @staticmethod
    def get_m2m_fields(fields):
        return (f.name for f in fields if isinstance(f, ManyToManyField))

    def get_metaproject_fields(self, names=None):
        names = names if names else []
        return [
            f
            for f in MetaProject._meta.get_fields()
            if f.name in names and not isinstance(f, ForeignObjectRel)
        ]

    def get_project_fields(self):
        old_fields_included = [
            "additional_funding",
            "date_comp_revised",
        ]
        non_reverse = (
            f for f in Project._meta.get_fields() if not isinstance(f, ForeignObjectRel)
        )
        non_old = [
            f
            for f in non_reverse
            if (
                getattr(f, "help_text", None) != OLD_FIELD_HELP_TEXT
                or f.name in old_fields_included
            )
        ]
        return non_old

    def export(self):
        t0 = time()
        odp_writer = ProjectsOdsOdpWriter(self._make_sheet("Substances"))
        funds_writer = ProjectsFundsWriter(self._make_sheet("Funds"))
        meeting_updates_writer = ProjectsMeetingUpdatesWriter(
            self._make_sheet("Meeting updates")
        )
        ProjectsV2DumpWriter(
            self.sheet_projects,
            self.project_fields,
            self.metaproject_fields,
        ).write(
            self.queryset,
            odp_writer.write,
            funds_writer.write,
            meeting_updates_writer.write,
        )
        print(f"Done in {time() - t0:.2f} seconds.")
        return workbook_response("Projects database dump", self.wb)
