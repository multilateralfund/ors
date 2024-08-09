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
        self.sheet.merge_cells("A4:C4")
        self.sheet.merge_cells("A6:C6")
        self.sheet.merge_cells("A5:C5")
        for row in range(4, 7):
            self.sheet.row_dimensions[row].height = 30
            self.sheet.cell(row=row, column=1).alignment = Alignment(
                horizontal="center", vertical="center", wrap_text=True
            )

    def write_header_cell(self, value, comment=None):
        cell = WriteOnlyCell(self.sheet, value=value)
        cell.font = Font(name="Times New Roman", bold=True)
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
        cell.font = Font(name="Times New Roman")
        cell.border = Border(
            top=Side(style="thin"),
            left=Side(style="thin"),
            right=Side(style="thin"),
            bottom=Side(style="thin"),
        )
        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        return cell


class StatusOfContributionsWriter(WriteOnlyBase):
    BOLD_RECORD_CELLS = ["TOTAL", "SUB-TOTAL"]

    def __init__(self, sheet, period=None, extra_headers=None):
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
        ]

        if extra_headers:
            headers.extend(extra_headers)
        self.period = period
        super().__init__(sheet, headers)

    def do_prewriting(self):
        columns_number = len(self.headers)
        self.sheet.merge_cells(
            start_row=5, start_column=1, end_row=5, end_column=columns_number
        )
        self.sheet.merge_cells(
            start_row=6, start_column=1, end_row=6, end_column=columns_number
        )
        self.sheet.merge_cells(
            start_row=7, start_column=1, end_row=7, end_column=columns_number
        )
        self.sheet.merge_cells(
            start_row=8, start_column=1, end_row=8, end_column=columns_number
        )
        self.sheet.cell(row=5, column=1).alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        self.sheet.cell(row=6, column=1).alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        self.sheet.cell(row=7, column=1).alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        self.sheet.cell(row=5, column=1).value = (
            "TRUST  FUND FOR THE  MULTILATERAL FUND FOR THE IMPLEMENTATION OF THE MONTREAL PROTOCOL"
        )
        self.sheet.cell(row=6, column=1).value = (
            f"Status of Contributions for {self.period} (US$)"
        )
        self.sheet.cell(row=7, column=1).value = "As at 24/05/2024"

    def write(self, data):
        self.do_prewriting()
        super().write(data)

    def write_header_cell(self, value, comment=None):
        cell = super().write_header_cell(value, comment)
        cell.font = Font(name="Times New Roman", bold=True)
        return cell

    def write_record_cell(self, value, read_only=False):
        cell = super().write_record_cell(value, read_only)
        if any(bold_string == value for bold_string in self.BOLD_RECORD_CELLS):
            cell.border = Border(
                top=Side(style="thick"),
                bottom=Side(style="thick"),
            )
            cell.font = Font(name="Times New Roman", bold=True)

        return cell


class StatisticsStatusOfContributionsWriter(WriteOnlyBase):
    BOLD_RECORD_CELLS = ["Total payments"]

    def __init__(self, sheet, headers, period=None):
        self.headers = headers
        self.period = period
        super().__init__(sheet, headers)

    def do_prewriting(self):
        columns_number = len(self.headers)
        self.sheet.merge_cells(
            start_row=5, start_column=1, end_row=5, end_column=columns_number
        )
        self.sheet.merge_cells(
            start_row=6, start_column=1, end_row=6, end_column=columns_number
        )
        self.sheet.merge_cells(
            start_row=7, start_column=1, end_row=7, end_column=columns_number
        )
        self.sheet.merge_cells(
            start_row=8, start_column=1, end_row=8, end_column=columns_number
        )
        self.sheet.cell(row=5, column=1).alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        self.sheet.cell(row=6, column=1).alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        self.sheet.cell(row=7, column=1).alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        self.sheet.cell(row=8, column=1).alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        self.sheet.cell(row=5, column=1).value = (
            "TRUST  FUND FOR THE  MULTILATERAL FUND FOR THE IMPLEMENTATION OF THE MONTREAL PROTOCOL"
        )
        self.sheet.cell(row=6, column=1).value = (
            f"{self.period} SUMMARY STATUS OF CONTRIBUTIONS AND OTHER INCOME (US$)"
        )
        self.sheet.cell(row=7, column=1).value = (
            "BALANCE  AVAILABLE   FOR  NEW  ALLOCATIONS"
        )
        self.sheet.cell(row=8, column=1).value = "As at 24/05/2024"

    def write(self, data):
        self.do_prewriting()
        super().write(data)

    def write_header_cell(self, value, comment=None):
        cell = super().write_header_cell(value, comment)
        cell.font = Font(name="Times New Roman", bold=True)
        return cell

    def write_record_cell(self, value, read_only=False):
        cell = super().write_record_cell(value, read_only)
        if any(bold_string == value for bold_string in self.BOLD_RECORD_CELLS):
            cell.font = Font(name="Times New Roman", bold=True)

        return cell
