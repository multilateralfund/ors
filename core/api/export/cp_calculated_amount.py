from openpyxl.styles import DEFAULT_FONT, Font

from core.api.export.base import BaseWriter


class CPCalculatedAmountWriter(BaseWriter):
    ROW_HEIGHT = 25
    COLUMN_WIDTH = 17
    header_row_start_idx = 1

    def __init__(self, wb, year):
        headers = [
            {
                "id": "substance_name",
                "headerName": "Substances",
            },
            {
                "id": "unit",
                "headerName": "Unit",
            },
            {
                "id": "sectorial_total",
                "headerName": f"{year} - Calculated Total Sectoral",
                "type": "number",
                "align": "right",
            },
            {
                "id": "consumption",
                "headerName": f"{year} - Calculated Consumption = Import-Export+Production",
                "type": "number",
                "align": "right",
                "column_width": self.COLUMN_WIDTH,
            },
        ]
        sheet = wb.create_sheet("Calculated Amount")
        super().__init__(sheet, headers)

    def _write_header_cell(self, row, column, value, comment=None):
        cell = super()._write_header_cell(row, column, value, comment)
        cell.font = Font(name=DEFAULT_FONT.name, bold=True, size=7)
        return cell

    def _write_record_cell(
        self, row, column, value, read_only=False, align="left", can_be_clipped=False
    ):
        cell = super()._write_record_cell(
            row, column, value, read_only, align, can_be_clipped
        )
        cell.font = Font(size=7)
        return cell
