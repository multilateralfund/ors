from functools import lru_cache
from functools import partial

import openpyxl
from django.db.models import JSONField
from django.db.models.fields import BooleanField
from django.db.models.fields import DateField
from django.db.models.fields import DateTimeField
from django.db.models.fields.related import ForeignKey
from django.db.models.fields.related import ManyToManyField
from django.db.models.fields.reverse_related import ForeignObjectRel

from core.api.export.base import BaseWriter
from core.api.export.base import configure_sheet_print
from core.api.export.single_project_v2.helpers import format_iso_date
from core.api.utils import workbook_response
from core.models import Project

from core.models.project import OLD_FIELD_HELP_TEXT


def get_field_value(project, header):
    field_name = header["id"]
    return getattr(project, field_name, "")


def get_value_date(project, header):
    value = get_field_value(project, header)
    return format_iso_date(value)


def get_value_fk(_f, project, header):
    value = get_field_value(project, header)
    return str(value) if value else ""


def get_value_m2m(_f, project, header):
    value = get_field_value(project, header)
    try:
        return str(value) if value else ""
    except Exception:  # pylint: disable=broad-exception-caught
        return "UNABLE TO RETRIEVE VALUE"


class ProjectsV2DumpWriter(BaseWriter):
    header_row_start_idx = 1
    COLUMN_WIDTH = 20

    def __init__(self, sheet, fields):
        headers = list(self._build_headers(fields))
        super().__init__(sheet, headers)

    def _build_headers(self, fields):
        for f in fields:
            if isinstance(f, DateField):
                yield self._handle_date_field(f)
            elif isinstance(f, DateTimeField):
                yield self._handle_datetime_field(f)
            elif isinstance(f, BooleanField):
                yield self._handle_datetime_field(f)
            elif isinstance(f, JSONField):
                continue
            elif isinstance(f, ForeignKey):
                yield self._handle_foreignkey_field(f)
            elif isinstance(f, ManyToManyField):
                yield self._handle_manytomany_field(f)
            else:
                yield self._field_header(f)

    def _field_header(self, f):
        return {
            "id": f.name,
            "headerName": f.name,
            "method": get_field_value,
        }

    def _handle_date_field(self, f):
        header = self._field_header(f)
        header["method"] = get_value_date
        return header

    _handle_datetime_field = _handle_date_field

    def _handle_foreignkey_field(self, f: ForeignKey):
        header = self._field_header(f)
        header["method"] = partial(get_value_fk, f)
        return header

    def _handle_manytomany_field(self, f: ForeignKey):
        header = self._field_header(f)
        header["method"] = partial(get_value_m2m, f)
        return header


class ProjectsV2Dump:
    def __init__(self, view):
        self.view = view
        self.queryset = self.view.filter_queryset(self.view.get_queryset())
        self.setup_workbook()

    def setup_workbook(self):
        wb = openpyxl.Workbook()
        # delete default sheet
        del wb[wb.sheetnames[0]]
        sheet = wb.create_sheet("Projects")
        configure_sheet_print(sheet, "landscape")
        self.wb = wb
        self.sheet = sheet

    @lru_cache
    def get_valid_fields(self):
        non_reverse = (
            f for f in Project._meta.get_fields() if not isinstance(f, ForeignObjectRel)
        )
        non_old = (
            f
            for f in non_reverse
            if getattr(f, "help_text", None) != OLD_FIELD_HELP_TEXT
        )
        return list(non_old)

    def export(self):
        ProjectsV2DumpWriter(self.sheet, self.get_valid_fields()).write(self.queryset)
        return workbook_response("Projects database dump", self.wb)
