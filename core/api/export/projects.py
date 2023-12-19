from core.api.export.base import WriteOnlyBase
from core.api.export.base import COLUMN_WIDTH


class ProjectWriter(WriteOnlyBase):
    header_row_start_idx = 1

    def __init__(self, sheet):
        headers = [
            {
                "id": "code",
                "headerName": "Code",
                "column_width": COLUMN_WIDTH * 2,
            },
            {
                "id": "code_legacy",
                "headerName": "Legacy code",
                "column_width": COLUMN_WIDTH * 2,
            },
            {
                "id": "metaproject_code",
                "headerName": "Metaproject Code",
            },
            {
                "id": "cluster",
                "headerName": "Cluster",
                "column_width": COLUMN_WIDTH * 2,
            },
            {
                "id": "metaproject_category",
                "headerName": "Metaproject category",
            },
            {
                "id": "project_type",
                "headerName": "Project type",
            },
            {
                "id": "project_type_legacy",
                "headerName": "Legacy project type",
            },
            {
                "id": "agency",
                "headerName": "Agency",
            },
            {
                "id": "sector",
                "headerName": "Sector",
                "column_width": COLUMN_WIDTH * 1.5,
            },
            {
                "id": "sector_legacy",
                "headerName": "Legacy sector",
            },
            {
                "id": "subsector",
                "headerName": "Subsector",
                "column_width": COLUMN_WIDTH * 1.5,
            },
            {
                "id": "subsector_legacy",
                "headerName": "Legacy subsector",
            },
            {
                "id": "substance_type",
                "headerName": "Substance type",
            },
            {
                "id": "substance_name",
                "headerName": "Substance",
            },
            {
                "id": "status",
                "headerName": "Status",
                "column_width": COLUMN_WIDTH * 1.5,
            },
            {
                "id": "country",
                "headerName": "Country",
            },
            {
                "id": "title",
                "headerName": "Title",
                "column_width": COLUMN_WIDTH * 5,
            },
        ]

        super().__init__(sheet, headers)
