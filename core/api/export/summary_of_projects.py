from core.api.export.base import BaseWriter


class SummaryOfProjectsWriter(BaseWriter):
    ROW_HEIGHT = 35
    COLUMN_WIDTH = 20
    header_row_start_idx = 1

    def __init__(self, sheet):
        headers = [
            {
                "id": "text",
                "headerName": "Projects and activities",
            },
            {
                "id": "countries_count",
                "headerName": "No. of countries",
            },
            {
                "id": "projects_count",
                "headerName": "No. of funding requests",
            },
            {
                "id": "amounts_recommended",
                "headerName": "Amounts recommended (US $)",
                "type": "number",
                "align": "right",
                "cell_format": "$###,###,##0.00#############",
            },
            {
                "id": "amounts_in_principle",
                "headerName": "Amounts in principle (US $)",
                "type": "number",
                "align": "right",
                "cell_format": "$###,###,##0.00#############",
            },
        ]

        super().__init__(sheet, headers)
