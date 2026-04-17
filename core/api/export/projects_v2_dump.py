from functools import cached_property
from functools import partial
from itertools import chain
from itertools import pairwise
from time import time
from typing import Sequence
from typing import TYPE_CHECKING

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

if TYPE_CHECKING:
    from core.api.views import ProjectV2ViewSet


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
        values = value.all()
        if values:
            return ", ".join(getattr(v, "name", str(v)) for v in values)
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
                "method": lambda p, h: not bool(getattr(p, h["id"])),
            },
            {
                "id": "code",
                "headerName": "Project code",
            },
            {
                "id": "legacy_code",
                "headerName": "Project legacy code",
            },
            {
                "id": "status",
                "headerName": "Project status",
                "method": lambda p, h: get_value_fk(None, p, h),
            },
        ]

    def get_base_row(self, p):
        base_row = []
        for h in self.project_headers:
            method = h.get("method", lambda p, h: getattr(p, h["id"]))
            base_row.append(method(p, h))
        return base_row


class ProjectsFundsWriter(SheetWriter):
    def __init__(self, sheet, version_map):
        super().__init__(sheet)
        self.version_map = version_map

    def get_version(self, p, version):
        key = (p.final_version.id, version)
        return self.version_map.get(key)

    def calc_total_fund(self, p, _):
        result = None
        if p.status.name == "Transferred":
            if p.version == 3:
                return p.total_fund or 0
            if p.version > 3:
                prev_version = self.get_version(p, p.version - 1)
                if prev_version:
                    tf = p.fund_transferred or 0
                    prev_tf = prev_version.fund_transferred or 0
                    result = ((p.total_fund or 0) + tf) - (
                        (prev_version.total_fund or 0) + prev_tf
                    )
                    return result
            tf = p.fund_transferred or 0
            result = (p.total_fund or 0) + tf
            return result
        if p.version == 3:
            result = p.total_fund or 0
        elif p.version > 3:
            prev_version = self.get_version(p, p.version - 1)
            if prev_version:
                result = (p.total_fund or 0) - (prev_version.total_fund or 0)
        return result

    def calc_support_cost_psc(self, p, _):
        result = None
        if p.status.name == "Transferred":
            if p.version == 3:
                return p.support_cost_psc or 0
            if p.version > 3:
                prev_version = self.get_version(p, p.version - 1)
                if prev_version:
                    tpsc = p.psc_transferred or 0
                    prev_tpsc = prev_version.psc_transferred or 0
                    result = ((p.support_cost_psc or 0) + tpsc) - (
                        (prev_version.support_cost_psc or 0) + prev_tpsc
                    )
                    return result
            tpsc = p.psc_transferred or 0
            result = (p.support_cost_psc or 0) + tpsc
            return result
        if p.version == 3:
            result = p.support_cost_psc or 0
        elif p.version > 3:
            prev_version = self.get_version(p, p.version - 1)
            if prev_version:
                result = (p.support_cost_psc or 0) - (
                    prev_version.support_cost_psc or 0
                )
        return result

    def display_total_fund(self, p, _):
        if p.status.name == "Transferred":
            tf = p.fund_transferred or 0
            result = (p.total_fund or 0) + tf
            return result
        return p.total_fund or 0

    def display_support_cost_psc(self, p, _):
        if p.status.name == "Transferred":
            tpsc = p.psc_transferred or 0
            result = (p.support_cost_psc or 0) + tpsc
            return result
        return p.support_cost_psc or 0

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
                    "method": self.display_total_fund,
                },
                {
                    "id": "support_cost_psc",
                    "headerName": "Support cost",
                    "method": self.display_support_cost_psc,
                },
                {
                    "id": "meeting",
                    "headerName": "Meeting ID",
                    "method": lambda p, _: p.meeting.number,
                },
                {
                    "id": "post_excom_meeting",
                    "headerName": "Post ExCom meeting ID",
                    "method": lambda p, _: (
                        p.post_excom_meeting.number if p.post_excom_meeting else None
                    ),
                },
                {
                    "id": "transfer_meeting",
                    "headerName": "Transfer meeting ID",
                    "method": lambda p, _: (
                        p.transfer_meeting.number if p.transfer_meeting else None
                    ),
                },
                {
                    "id": "date_approved",
                    "headerName": "Date approved",
                },
                {
                    "id": "adjustment",
                    "headerName": "Adjustment",
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
        version_pos = 0
        for idx, h in enumerate(project_headers):
            if h["id"] == "version":
                version_pos = idx
                break

        project_headers.insert(
            version_pos + 1,
            {
                "id": "latest_project_id",
                "headerName": "Is latest version",
                "method": lambda p, h: not bool(getattr(p, h["id"])),
            },
        )
        metaproject_headers = self._build_headers(
            metaproject_fields, source="meta_project"
        )
        self.headers = project_headers[:2] + metaproject_headers + project_headers[2:]

    def display_total_fund(self, p, _):
        if p.status.name == "Transferred":
            tf = p.fund_transferred or 0
            result = (p.total_fund or 0) + tf
            return result
        return p.total_fund or 0

    def display_support_cost_psc(self, p, _):
        if p.status.name == "Transferred":
            tpsc = p.psc_transferred or 0
            result = (p.support_cost_psc or 0) + tpsc
            return result
        return p.support_cost_psc or 0

    def write(self, projects, *with_project):
        self.sheet.append([h["headerName"] for h in self.headers])
        for p in projects:
            self.sheet.append([h["method"](p, h) for h in self.headers])
            for writer in with_project:
                writer(p)

    def _build_headers(self, fields, source=None):
        result = []
        field_names = {
            f["write_field_name"]: f["label"]
            for f in ProjectField.objects.all().values("write_field_name", "label")
        }

        for f in fields:
            if isinstance(f, tuple):
                f, title = f
            else:
                title = field_names.get(f.name, f.name)
            header = {
                "id": f.name,
                "headerName": title,
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
        result.append(
            {
                "id": "actual_total_fund",  # dummy value here, this column does not exist
                "headerName": "Actual funds",
                "method": lambda p, _: self.display_total_fund(p, None),
            },
        )
        result.append(
            {
                "id": "actual_psc",  # dummy value here, this column does not exist
                "headerName": "Actual PSC",
                "method": lambda p, _: self.display_support_cost_psc(p, None),
            }
        )
        return result


class ProjectsV2Dump:
    """MYA Warehouse"""

    def __init__(self, view: "ProjectV2ViewSet"):
        self.view = view
        self.project_fields = self.get_project_fields()
        self.metaproject_fields = self.get_metaproject_fields(
            [("end_date", "End date (MYA)")]
        )
        queryset = (
            Project.objects.really_all()
            .select_related(*self.get_fk_fields(self.project_fields))
            .prefetch_related(
                *self.get_m2m_fields(self.project_fields),
                "component__projects",
                Prefetch(
                    "ods_odp",
                    queryset=ProjectOdsOdp.objects.all().select_related(
                        "ods_substance", "ods_blend"
                    ),
                ),
            )
        )

        # Requested in #35434.
        if view.request.user.has_perm("core.is_mlfs_user"):
            queryset = queryset.exclude(submission_status__name="Draft")

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
        return [f.name for f in fields if isinstance(f, ForeignKey)]

    @staticmethod
    def get_m2m_fields(fields):
        return [f.name for f in fields if isinstance(f, ManyToManyField)]

    def get_metaproject_fields(self, names=None):
        names = names if names else []
        result = []
        for name, title in names:
            field = MetaProject._meta.get_field(name)
            if field and not isinstance(field, ForeignObjectRel):
                result.append((field, title))
        return result

    def get_project_fields(self):
        old_fields_included = [
            "additional_funding",
            "date_comp_revised",
        ]
        exclude_fields = [
            "serial_number_legacy",
            "serial_number",
            "total_fund_transferred",
            "total_psc_transferred",
        ]
        want_order = [
            "sector",
            "subsectors",
        ]

        result = []
        order = []

        for f in Project._meta.get_fields():
            if f.name in exclude_fields:
                continue

            if isinstance(f, ForeignObjectRel):
                continue

            is_old = getattr(f, "help_text", None) == OLD_FIELD_HELP_TEXT
            skip_old = is_old and f.name not in old_fields_included
            if skip_old:
                continue

            result.append(f)
            order.append(f.name)

        for before, after in pairwise(want_order):
            idx_before = order.index(before)
            idx_after = order.index(after)
            order.insert(idx_before + 1, order.pop(idx_after))
            result.insert(idx_before + 1, result.pop(idx_after))
        return result

    def export(self):
        t0 = time()

        # Do this once here, since we need to iterate over
        # the queryset twice (once to build the version map).
        projects = list(self.queryset)
        print(f"Projects queried in {time() - t0:.2f} seconds.")

        version_map = {(p.final_version.id, p.version): p for p in projects}
        odp_writer = ProjectsOdsOdpWriter(self._make_sheet("Substances"))
        funds_writer = ProjectsFundsWriter(self._make_sheet("Funds"), version_map)
        # meeting_updates_writer = ProjectsMeetingUpdatesWriter(
        #     self._make_sheet("Meeting updates")
        # )
        ProjectsV2DumpWriter(
            self.sheet_projects,
            self.project_fields,
            self.metaproject_fields,
        ).write(
            projects,
            odp_writer.write,
            funds_writer.write,
            # meeting_updates_writer.write,
        )
        print(f"Done in {time() - t0:.2f} seconds.")
        return workbook_response("Projects database dump", self.wb)
