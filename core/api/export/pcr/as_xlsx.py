import io
from datetime import date
from decimal import Decimal

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

from core.api.export.pcr.constants import SECTIONS
from core.api.export.pcr.sections import Amount, Fields, PCRDocument

# The PCR is identified on every row, as the rows of all the PCRs are in one sheet
ID_HEADERS = ["Metacode", "Country", "Lead agency"]

SHEET_NAMES = {
    "overview": "Overview",
    "project_results": "Project results",
    "causes_of_delay": "Causes of delay",
    "lessons_learned": "Lessons learned",
    "gender_mainstreaming": "Gender mainstreaming",
    "sdgs": "SDGs",
    "summary_of_key_data": "Summary of key data",
    "supporting_evidence": "Supporting evidence",
}

HEADER_FONT = Font(bold=True)
HEADER_FILL = PatternFill("solid", fgColor="F2F2F2")
TITLE_FONT = Font(bold=True, size=12)
COLUMN_WIDTH = 22


def _cell_value(value):
    """Value and number format of an Excel cell"""
    if isinstance(value, Amount):
        return float(value.value), "#,##0.00"
    if isinstance(value, Decimal):
        return float(value), None
    if isinstance(value, bool):
        return ("Yes" if value else "No"), None
    if isinstance(value, date):
        return value, "DD/MM/YYYY"
    if value == "":
        return None, None
    return value, None


class _BlockRows:
    """The rows of a block, for all the exported PCRs"""

    def __init__(self, title):
        self.title = title
        self.headers = []
        self.rows = []

    def add_fields(self, id_values, block: Fields):
        values = {}
        for label, value in block.items:
            if label not in self.headers:
                self.headers.append(label)
            values[label] = value
        self.rows.append((id_values, values))

    def add_table(self, id_values, block):
        if not self.headers:
            self.headers = list(block.headers)
        for row in block.rows:
            self.rows.append((id_values, dict(zip(block.headers, row))))


class PCRWorkbookBuilder:
    def __init__(self, section_keys):
        self.section_keys = [key for key, _ in SECTIONS if key in section_keys]
        self.identification = _BlockRows("Exported PCRs")
        # section key -> the rows of each block of the section
        self.sections: dict[str, list[_BlockRows]] = {
            key: [] for key in self.section_keys
        }
        self.not_included = []

    def add(self, document: PCRDocument):
        id_values = [document.metacode, document.country, document.lead_agency]
        self.identification.add_fields(id_values, document.identification)
        for section in document.sections:
            blocks_rows = self.sections[section.key]
            for index, block in enumerate(section.blocks):
                if index == len(blocks_rows):
                    blocks_rows.append(_BlockRows(block.title or section.title))
                if isinstance(block, Fields):
                    blocks_rows[index].add_fields(id_values, block)
                else:
                    blocks_rows[index].add_table(id_values, block)

    def add_not_included(self, metacode, country, lead_agency, reason):
        self.not_included.append([metacode, country, lead_agency, reason])

    @staticmethod
    def _write_header(sheet, row_idx, headers):
        for col_idx, header in enumerate(headers, start=1):
            cell = sheet.cell(row=row_idx, column=col_idx, value=header)
            cell.font = HEADER_FONT
            cell.fill = HEADER_FILL
            cell.alignment = Alignment(wrap_text=True, vertical="top")

    @staticmethod
    def _write_row(sheet, row_idx, values):
        for col_idx, value in enumerate(values, start=1):
            cell_value, number_format = _cell_value(value)
            cell = sheet.cell(row=row_idx, column=col_idx, value=cell_value)
            cell.alignment = Alignment(wrap_text=True, vertical="top")
            if number_format:
                cell.number_format = number_format

    def _write_blocks(self, sheet, blocks_rows, with_titles):
        row_idx = 1
        max_columns = 0
        for block_rows in blocks_rows:
            if with_titles:
                sheet.cell(row=row_idx, column=1, value=block_rows.title).font = (
                    TITLE_FONT
                )
                row_idx += 1
            headers = ID_HEADERS + block_rows.headers
            max_columns = max(max_columns, len(headers))
            self._write_header(sheet, row_idx, headers)
            row_idx += 1
            for id_values, values in block_rows.rows:
                self._write_row(
                    sheet,
                    row_idx,
                    id_values + [values.get(header) for header in block_rows.headers],
                )
                row_idx += 1
            # empty row between the blocks
            row_idx += 1
        for col_idx in range(1, max_columns + 1):
            sheet.column_dimensions[get_column_letter(col_idx)].width = COLUMN_WIDTH

    def render(self) -> bytes:
        wb = openpyxl.Workbook()
        sheet = wb.active
        sheet.title = "PCRs"
        self._write_blocks(sheet, [self.identification], with_titles=False)
        sheet.freeze_panes = "A2"

        for key in self.section_keys:
            sheet = wb.create_sheet(SHEET_NAMES[key])
            self._write_blocks(sheet, self.sections[key], with_titles=True)

        if self.not_included:
            sheet = wb.create_sheet("Not included")
            headers = ID_HEADERS + ["Reason"]
            self._write_header(sheet, 1, headers)
            for row_idx, row in enumerate(self.not_included, start=2):
                self._write_row(sheet, row_idx, row)
            for col_idx in range(1, len(headers) + 1):
                sheet.column_dimensions[get_column_letter(col_idx)].width = COLUMN_WIDTH
            sheet.column_dimensions[get_column_letter(len(headers))].width = 60

        out = io.BytesIO()
        wb.save(out)
        return out.getvalue()
