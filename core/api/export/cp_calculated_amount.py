from core.api.export.base import BaseWriter


class CPCalculatedAmountWriter(BaseWriter):
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
            },
            {
                "id": "consumption",
                "headerName": f"{year} - Calculated Consumption = Import-Export+Production",
                "type": "number",
            },
            {
                "id": "substances",
                "headerName": "Substances List",
            },
        ]
        sheet = wb.create_sheet("Calculated Amount")
        super().__init__(sheet, headers)
