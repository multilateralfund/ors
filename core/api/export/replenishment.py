from openpyxl.cell import WriteOnlyCell
from openpyxl.styles import DEFAULT_FONT, Font, Side, Border, Alignment

from core.api.export.base import WriteOnlyBase

EMPTY_ROW = (None, None, None)


class DashboardWriter(WriteOnlyBase):
    COLUMN_WIDTH = 25

    def set_dimensions(self):
        self.sheet.column_dimensions["A"].width = self.COLUMN_WIDTH * 2
        self.sheet.column_dimensions["B"].width = self.COLUMN_WIDTH
        self.sheet.column_dimensions["C"].width = self.COLUMN_WIDTH

    def write_data(self, data):
        for key, cell_b, cell_c in data:
            record_row = []
            if cell_b is None and cell_c is None:
                record_row.append(self.write_header_cell(key))
            else:
                record_row.append(self.write_record_cell(key))

            record_row.append(self.write_record_cell(cell_b))
            record_row.append(self.write_record_cell(cell_c))

            self.sheet.append(record_row)

    def write_header_cell(self, value, comment=None):
        cell = WriteOnlyCell(self.sheet, value=value)
        cell.font = Font(name=DEFAULT_FONT.name, bold=True)
        cell.border = Border(
            top=Side(style="thin"),
            left=Side(style="thin"),
            right=Side(style="thin"),
            bottom=Side(style="thin"),
        )
        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        return cell

    def write_record_cell(self, value, read_only=False):
        cell = WriteOnlyCell(self.sheet, value=value)
        cell.font = Font(name=DEFAULT_FONT.name)
        cell.border = Border(
            top=Side(style="thin"),
            left=Side(style="thin"),
            right=Side(style="thin"),
            bottom=Side(style="thin"),
        )
        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        return cell


class SummaryStatusOfContributionsWriter(WriteOnlyBase):

    def __init__(self, sheet):
        headers = [
            {
                "id": "country",
                "headerName": "Party",
                "column_width": 25,
            },
            {
                "id": "agreed_contributions",
                "headerName": "Agreed contributions",
                "column_width": 25,
            },
            {
                "id": "cash_payments",
                "headerName": "Cash payments",
                "column_width": 25,
            },
            {
                "id": "bilateral_assistance",
                "headerName": "Bilateral assistance",
                "column_width": 25,
            },
            {
                "id": "promissory_notes",
                "headerName": "Promissory notes",
                "column_width": 25,
            },
            {
                "id": "outstanding_contributions",
                "headerName": "Outstanding contributions",
                "column_width": 25,
            },
            {
                "id": "gain_loss",
                "headerName": "Exchange (Gain)/Loss. NB:Negative amount = Gain",
                "column_width": 25,
            },
        ]
        super().__init__(sheet, headers)

    def write_record_cell(self, value, read_only=False):
        cell = super().write_record_cell(value, read_only)
        if any(
            bold_string == value
            for bold_string in ["TOTAL", "SUB-TOTAL", "Disputed contributions", "CEIT"]
        ):
            cell.border = Border(
                top=Side(style="thick"),
                left=Side(style="thick"),
                right=Side(style="thick"),
                bottom=Side(style="thick"),
            )
            cell.font = Font(name=DEFAULT_FONT.name, bold=True)

        return cell
