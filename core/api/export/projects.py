from core.api.export.base import BaseWriter
from core.api.export.base import COLUMN_WIDTH


class ProjectWriter(BaseWriter):
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
            },
            {
                "id": "metaproject_code",
                "headerName": "Metaproject Code",
            },
            {
                "id": "cluster",
                "headerName": "Cluster",
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
            },
            {
                "id": "sector_legacy",
                "headerName": "Legacy sector",
            },
            {
                "id": "subsector",
                "headerName": "Subsector",
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
            },
            {
                "id": "country",
                "headerName": "Country",
            },
            {
                "id": "title",
                "headerName": "Title",
            },
        ]

        super().__init__(sheet, headers)
