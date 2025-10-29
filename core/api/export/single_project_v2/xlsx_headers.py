from typing import Iterable
from typing import List

from core.api.export.base import HeaderType
from core.api.export.base import WriteOnlyBase
from core.api.export.single_project_v2.helpers import format_iso_date
from core.api.export.single_project_v2.helpers import get_blanket_consideration_value
from core.models import ProjectField


def get_headers_identifiers() -> List[HeaderType]:
    return [
        {
            "id": "country",
            "headerName": "Country",
        },
        {
            "id": "meeting",
            "headerName": "Meeting number",
        },
        {
            "id": "agency",
            "headerName": "Agency",
        },
        {
            "id": "cluster",
            "headerName": "Cluster",
            "method": lambda r, h: r[h["id"]]["name"],
            "column_width": WriteOnlyBase.COLUMN_WIDTH * 1.5,
        },
        {
            "id": "submission_status",
            "headerName": "Submission status",
        },
    ]


def get_headers_cross_cutting() -> List[HeaderType]:
    return [
        {
            "id": "title",
            "headerName": "Title",
        },
        {
            "id": "description",
            "headerName": "Description",
        },
        {
            "id": "project_type",
            "headerName": "Type",
            "method": lambda r, h: r[h["id"]]["name"],
        },
        {
            "id": "sector",
            "headerName": "Sector",
            "method": lambda r, h: r[h["id"]]["name"],
        },
        {
            "id": "subsectors",
            "headerName": "Subsectors",
            "method": lambda r, h: ", ".join(ss["name"] for ss in r[h["id"]]),
            "column_width": WriteOnlyBase.COLUMN_WIDTH * 1.5,
        },
        {
            "id": "is_lvc",
            "headerName": "LVC/Non-LVC",
            "method": lambda r, h: r[h["id"]] and "LVC" or "Non-LVC",
            "column_width": WriteOnlyBase.COLUMN_WIDTH * 1.5,
        },
        {
            "id": "total_fund",
            "headerName": "Project funding",
            "type": "number",
            "align": "right",
            "cell_format": "$###,###,##0.00#############",
        },
        {
            "id": "support_cost_psc",
            "headerName": "Project support cost",
            "type": "number",
            "align": "right",
            "cell_format": "$###,###,##0.00#############",
        },
        {
            "id": "project_start_date",
            "headerName": "Project start date",
            "method": lambda r, h: format_iso_date(r[h["id"]]),
        },
        {
            "id": "project_end_date",
            "headerName": "Project end date",
            "method": lambda r, h: format_iso_date(r[h["id"]]),
        },
        {
            "id": "blanket_or_individual_consideration",
            "headerName": "Blanket approval/Individual consideration",
            "method": get_blanket_consideration_value,
        },
    ]


def get_headers_specific_information(fields: Iterable[ProjectField]):
    result = []

    for field in fields:
        result.append({"id": field.read_field_name, "headerName": field.label})

    return result
