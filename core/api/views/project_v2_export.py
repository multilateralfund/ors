from typing import List

from datetime import datetime

import io
import pathlib
import logging

import openpyxl
import docx

from docx.table import Table
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P

from django.http import FileResponse

from rest_framework import serializers

from core.api.serializers.project_v2 import ProjectDetailsV2Serializer
from core.api.serializers.business_plan import BPActivityExportSerializer

from core.models.user import User
from core.models.project import Project
from core.models.business_plan import BPActivity
from core.models.project_metadata import ProjectSpecificFields
from core.models.project_metadata import ProjectField

from core.api.export.base import configure_sheet_print, WriteOnlyBase
from core.api.export.business_plan import BPActivitiesWriter

from core.api.utils import workbook_response


logger = logging.getLogger(__name__)


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


def dict_as_obj(d):
    class Dummy:
        pass

    inst = Dummy()
    for key, value in d.items():
        if isinstance(value, dict):
            setattr(inst, key, dict_as_obj(value))
        else:
            setattr(inst, key, value)

    return inst


def get_activity_data_from_json(data):
    result = {}
    serializer = BPActivityExportSerializer()
    data_as_obj = dict_as_obj(data)
    for field, handler in serializer.get_fields().items():
        if field == "chemical_detail":
            value = "/".join(data.get("substances", []))
        elif isinstance(handler, serializers.ChoiceField):
            value = f"{data[field]}"
        elif isinstance(handler, serializers.SlugRelatedField):
            value = data[field][handler.slug_field] if data[field] else None
        elif isinstance(handler, serializers.SerializerMethodField):
            method_field = handler.method_name or f"get_{field}"
            value_getter = getattr(serializer, method_field, lambda x: x)
            value = value_getter(data_as_obj)
        else:
            value = data.get(field, None)
        result[field] = value
    return result


def get_activity_data_from_instance(data):
    result = None
    try:
        activity = BPActivity.objects.get(id=data["bp_activity"]["id"])
        result = BPActivityExportSerializer(activity).data
    except BPActivity.DoesNotExist:
        logger.warning(
            "Linked activity (%s) missing for project %s. Fallback to JSON.",
            data["bp_activity"]["id"],
            data["id"],
        )
    return result


def get_activity_data(data):
    """Serialize Activity if it exists, otherwise use the saved json."""
    result = None

    if data.get("bp_activity"):
        result = get_activity_data_from_instance(data)

    if not result:
        bp_data = data.get("bp_activity_json")
        if bp_data:
            result = get_activity_data_from_json(bp_data)

    return result


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
        WriteOnlyBase(sheet, get_headers_identifiers()).write([data])

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
        WriteOnlyBase(sheet, get_headers_cross_cutting()).write([data])

    def _write_project_specific_fields(
        self,
        fields_obj: ProjectSpecificFields,
        fields_section: str,
        sheet_name: str,
        data,
    ):
        fields = fields_obj.fields.filter(section__in=[fields_section])
        if fields:
            sheet = self.add_sheet(sheet_name)
            WriteOnlyBase(
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
                "Specific information - Overview",
                [data],
            )

            self._write_project_specific_fields(
                project_specific_fields_obj,
                "Substance Details",
                "Specific information - Substance details",
                data.get("ods_odp", []),
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


def document_response(doc, filename):
    out = io.BytesIO()
    doc.save(out)
    out.seek(0)
    res = FileResponse(out, as_attachment=True, filename=filename)
    return res


class ProjectsV2ProjectExportDocx:
    user = User
    project: Project
    doc: docx.Document
    template_path = (
        pathlib.Path(__file__).parent.parent
        / "export"
        / "templates"
        / "Word Template for data entered into the system during project submission online.docx"
    )

    def __init__(self, project, user):
        self.user = user
        self.project = project
        with self.template_path.open("rb") as tpl:
            self.doc = docx.Document(tpl)

    def find_table(self, after_p_text=""):
        found = None

        if after_p_text:
            found_p = False
            for e in self.doc.element.body:
                if isinstance(e, CT_P) and e.text.strip() == after_p_text:
                    found_p = True
                elif isinstance(e, CT_Tbl) and found_p:
                    found = Table(e, self.doc)
                    break

        return found

    def build_front_page(self, data):
        for p in self.doc.paragraphs:
            p_style = {
                "italic": False,
                "bold": False,
                "underline": False,
            }

            if p.runs:
                for k in p_style:
                    p_style[k] = getattr(p.runs[0], k, False)

            if p.text.startswith("Generated on"):
                now = datetime.utcnow().strftime("%d/%m/%Y")
                user = self.user.get_full_name() or self.user.username
                agency = self.user.agency.name if self.user.agency else ""
                p.text = f"Generated on {now} by {user}" + (
                    'of "{agency}"' if agency else ""
                )
            elif p.text.startswith("Project Title"):
                p.text = self.project.title
            elif p.text.startswith("Country:"):
                p.text = f"{p.text} {data['country']}"
            elif p.text.startswith("Agency:"):
                p.text = f"{p.text} {data['agency']}"
            elif p.text.startswith("Cluster:"):
                p.text = f"{p.text} {data['cluster']['name']}"
            elif p.text.startswith("Amount:"):
                p.text = f"{p.text} {data['total_fund']}"
            elif p.text.startswith("Project Description:"):
                p.text = f"{p.text} {data['description']}"

            if p.runs:
                for k, v in p_style.items():
                    setattr(p.runs[0], k, v)

    def _write_header_to_table(self, headers, table, data):
        for header in headers:
            row = table.add_row()
            for c_idx, cell in enumerate(row.cells):
                if c_idx == 0:
                    cell.text = header["headerName"]
                elif c_idx == 1 and header.get("method"):
                    cell.text = header["method"](data, header)
                elif c_idx == 1:
                    cell.text = str(data[header["id"]] or "")

    def _write_substance_table(self, _, table, data):
        for d in data:
            row = table.add_row()
            row_data = [
                "ods_display_name",
                "???",
                "ods_replacement",
                "phase_out_mt",
                "co2_mt",
                "odp",
            ]
            for c_idx, cell in enumerate(row.cells):
                cell.text = str(d.get(row_data[c_idx], "") or "")

    def build_cross_cutting(self, data):
        table = self.find_table("Cross-cutting fields")
        self._write_header_to_table(get_headers_cross_cutting()[2:], table, data)

    def _write_project_specific_fields(
        self,
        fields_obj: ProjectSpecificFields,
        fields_section: str,
        after_paragraph: str,
        data,
        writer=None,
    ):
        if not writer:
            writer = self._write_header_to_table
        if data:
            fields = fields_obj.fields.filter(section__in=[fields_section])
            table = self.find_table(after_paragraph)
            if table and fields:
                headers = get_headers_specific_information(fields)
                writer(headers, table, data)

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
                "Project specific fields header",
                data,
            )
            self._write_project_specific_fields(
                project_specific_fields_obj,
                "Substance Details",
                "Substance details Page and tables",
                data.get("ods_odp", []),
                writer=self._write_substance_table,
            )
            self._write_project_specific_fields(
                project_specific_fields_obj,
                "Impact",
                "Impact (tabular)",
                data,
            )

    def build_document(self):
        serializer = ProjectDetailsV2Serializer(self.project)
        data = serializer.data

        self.build_front_page(data)
        self.build_cross_cutting(data)
        self.build_specific_information(data)

    def export_docx(self):
        self.build_document()
        return document_response(self.doc, filename=f"{self.project.id}.docx")
