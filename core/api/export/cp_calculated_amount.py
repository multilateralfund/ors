from openpyxl.styles import DEFAULT_FONT, Font

from core.api.export.base import BaseWriter


class CPCalculatedAmountWriter(BaseWriter):
    ROW_HEIGHT = 50
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
            },
        ]
        sheet = wb.create_sheet("Calculated Amount")
        super().__init__(sheet, headers)

    def _write_header_cell(self, row, column, value, comment=None):
        cell = super()._write_header_cell(row, column, value, comment)
        cell.font = Font(name=DEFAULT_FONT.name, bold=True, size=10)
        return cell
