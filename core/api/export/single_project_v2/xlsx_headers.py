from functools import partial
from typing import Iterable
from typing import List

from core.api.export.base import HeaderType
from core.api.export.base import WriteOnlyBase
from core.api.export.single_project_v2.helpers import field_value
from core.api.export.single_project_v2.helpers import field_value_or_computed
from core.api.export.single_project_v2.helpers import format_dollar_value
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


def get_headers_bp():
    return []


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
            "id": "individual_consideration",
            "headerName": "Blanket consideration",
            "method": get_blanket_consideration_value,
        },
    ]


def get_headers_metaproject() -> List[HeaderType]:
    return [
        {
            "id": "project_funding",
            "headerName": "Project Funding (MYA)",
            "method": partial(field_value_or_computed, formatter=format_dollar_value),
        },
        {
            "id": "support_cost",
            "headerName": "Support Cost (MYA)",
            "method": partial(field_value_or_computed, formatter=format_dollar_value),
        },
        {
            "id": "start_date",
            "headerName": "Start date (MYA)",
            "method": partial(field_value_or_computed, is_date=True),
        },
        {
            "id": "end_date",
            "headerName": "End date (MYA)",
            "method": partial(field_value_or_computed, is_date=True),
        },
        {
            "id": "phase_out_odp",
            "headerName": "Phase out (ODP t) (MYA)",
            "method": field_value_or_computed,
        },
        {
            "id": "phase_out_mt",
            "headerName": "Phase out (Mt) (MYA)",
            "method": field_value_or_computed,
        },
        {
            "id": "targets",
            "headerName": "Targets",
            "method": field_value,
        },
        {
            "id": "starting_point",
            "headerName": "Starting point",
            "method": field_value,
        },
        {
            "id": "baseline",
            "headerName": "Baseline",
            "method": field_value,
        },
        {
            "id": "number_of_enterprises_assisted",
            "headerName": "Number of enterprises assisted",
            "method": field_value,
        },
        {
            "id": "number_of_enterprises",
            "headerName": "Number of enterprises",
            "method": field_value,
        },
        {
            "id": "aggregated_consumption",
            "headerName": "Aggregated consumption",
            "method": field_value,
        },
        {
            "id": "number_of_production_lines_assisted",
            "headerName": "Number of Production Lines assisted",
            "method": field_value,
        },
        {
            "id": "cost_effectiveness_kg",
            "headerName": "Cost effectiveness (US$/ Kg)",
            "method": field_value,
        },
        {
            "id": "cost_effectiveness_co2",
            "headerName": "Cost effectiveness (US$/ CO2-ep)",
            "method": field_value,
        },
    ]


def get_headers_specific_information(fields: Iterable[ProjectField]):
    result = []

    for field in fields:
        result.append({"id": field.read_field_name, "headerName": field.label})

    return result
