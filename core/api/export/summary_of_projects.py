from core.api.export.base import WriteOnlyBase


class SummaryOfProjectsWriter(WriteOnlyBase):
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
            },
            {
                "id": "amounts_in_principle",
                "headerName": "Amounts in principle (US $)",
            },
        ]

        super().__init__(sheet, headers)
