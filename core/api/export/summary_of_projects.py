from openpyxl.styles import Font
from openpyxl.styles import PatternFill

from core.api.export.base import WriteOnlyBase


class SummaryOfProjectsWriter(WriteOnlyBase):
    ROW_HEIGHT = 35
    COLUMN_WIDTH = 20
    header_row_start_idx = 1
    FONT_NAME = "Times New Roman"
    TOTAL_VISIBLE_FIELDS = {"projects_count", "amounts_recommended"}

    def __init__(self, sheet, is_blanket_approval=False):
        headers = [
            {
                "id": "text",
                "headerName": "Projects and activities",
            },
            {
                "id": "countries_count",
                "headerName": "No. of countries",
                "align": "center",
                "cell_format": "0;-0;;@",
            },
            {
                "id": "projects_count",
                "headerName": "No. of funding requests",
                "align": "center",
                "cell_format": "0;-0;;@",
            },
            {
                "id": "amounts_recommended",
                "headerName": "Amounts recommended (US$)",
                "type": "number",
                "align": "right",
                "cell_format": "#,##0.00#############;-#,##0.00#############;;@",
            },
        ]

        if not is_blanket_approval:
            headers.append(
                {
                    "id": "amounts_in_principle",
                    "headerName": "Amounts in principle (US$)",
                    "type": "number",
                    "align": "right",
                    "cell_format": "#,##0.00#############;-#,##0.00#############;;@",
                }
            )

        super().__init__(sheet, headers)

    def write_header_cell(self, value, comment=None):
        cell = super().write_header_cell(value, comment)
        cell.font = Font(name=self.FONT_NAME, bold=True, sz=10)
        cell.fill = PatternFill()
        return cell

    def write_record_cell(self, value, read_only=False, align="left", cell_format=None):
        cell = super().write_record_cell(value, read_only, align, cell_format)
        cell.font = Font(name=self.FONT_NAME, sz=10)
        return cell
