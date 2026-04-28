from functools import partial

from core.api.export.base import BaseWriter
from core.api.export.projects_v2_dump import get_value_fk


class ProjectsInventoryReportWriter(BaseWriter):
    ROW_HEIGHT = 35
    COLUMN_WIDTH = 20
    header_row_start_idx = 1

    def __init__(self, sheet):
        headers = [
            {"id": "id", "headerName": "id", "method": lambda project, _: project.id},
            {
                "id": "country",
                "headerName": "Country",
                "method": partial(get_value_fk, None),
            },
            {
                "id": "metacode",
                "headerName": "Metacode",
                "method": lambda project, _: project.metacode,
            },
            {
                "id": "code",
                "headerName": "Code",
                "column_width": self.COLUMN_WIDTH * 2,
                "method": lambda project, _: project.code,
            },
            {
                "id": "code_legacy",
                "headerName": "Legacy code",
                "column_width": self.COLUMN_WIDTH * 2,
                "method": lambda project, _: project.legacy_code,
            },
            {
                "id": "agency",
                "headerName": "Agency",
                "method": partial(get_value_fk, None),
            },
            {
                "id": "lead_agency",
                "headerName": "Lead agency",
                "method": partial(get_value_fk, None),
            },
            {
                "id": "cluster",
                "headerName": "Cluster",
                "column_width": self.COLUMN_WIDTH * 2,
                "method": partial(get_value_fk, None),
            },
            {
                "id": "project_type",
                "headerName": "Type",
                "method": partial(get_value_fk, None, attr_name="code"),
            },
            {
                "id": "sector",
                "headerName": "Sector",
                "column_width": self.COLUMN_WIDTH * 1.5,
                "method": partial(get_value_fk, None),
            },
            {
                "id": "sector_legacy",
                "headerName": "Sector legacy",
                "method": lambda project, _: project.sector_legacy,
            },
            {
                "id": "subsectors_list",
                "headerName": "Sub-sector(s)",
                "column_width": self.COLUMN_WIDTH * 1.5,
                "method": lambda project, _: ", ".join(
                    subsector.name for subsector in project.subsectors.all()
                ),
            },
            {
                "id": "subsector_legacy",
                "headerName": "Subsector legacy",
                "method": lambda project, _: project.subsector_legacy,
            },
            {
                "id": "title",
                "headerName": "Title",
                "column_width": self.COLUMN_WIDTH * 5,
                "method": lambda project, _: project.title,
            },
            {
                "id": "description",
                "headerName": "Description",
                "column_width": self.COLUMN_WIDTH * 5,
                "method": lambda project, _: project.description,
            },
            {
                "id": "excom_provision",
                "headerName": "Executive Committee provision",
                "column_width": self.COLUMN_WIDTH * 5,
                "method": lambda project, _: project.excom_provision,
            },
            {
                "id": "products_manufactured",
                "headerName": "Product manufactured",
                "column_width": self.COLUMN_WIDTH * 3,
                "method": lambda project, _: project.products_manufactured,
            },
            {
                "id": "tranche",
                "headerName": "Tranche number",
                "method": lambda project, _: project.tranche,
            },
            {
                "id": "metaproject_category",
                "headerName": "Category",
                "method": lambda project, _: (
                    project.meta_project.type if project.meta_project else ""
                ),
            },
            {
                "id": "funding_window",
                "headerName": "Funding window",
                "method": lambda project, _: project.funding_window_id,
            },
            {
                "id": "production",
                "headerName": "Production",
                "type": "bool",
                "method": lambda project, _: project.production,
            },
        ]
        super().__init__(sheet, headers)
