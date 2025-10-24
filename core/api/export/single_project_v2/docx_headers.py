from typing import List

from core.api.export.base import HeaderType
from core.api.export.single_project_v2.helpers import get_date_value
from core.api.export.single_project_v2.helpers import get_dollar_value
from core.api.export.single_project_v2.helpers import get_value_or_dash


def get_headers_metaproject() -> List[HeaderType]:
    return [
        {
            "id": "project_funding",
            "headerName": "Project Funding (MYA)",
            "method": get_dollar_value,
        },
        {
            "id": "support_cost",
            "headerName": "Support Cost (MYA)",
            "method": get_dollar_value,
        },
        {
            "id": "start_date",
            "headerName": "Start date (MYA)",
            "method": get_date_value,
        },
        {
            "id": "end_date",
            "headerName": "End date (MYA)",
            "method": get_date_value,
        },
        {
            "id": "phase_out_odp",
            "headerName": "Phase out (ODP t) (MYA)",
            "method": get_value_or_dash,
        },
        {
            "id": "phase_out_mt",
            "headerName": "Phase out (Mt) (MYA)",
            "method": get_value_or_dash,
        },
        {
            "id": "targets",
            "headerName": "Targets",
            "method": get_value_or_dash,
        },
        {
            "id": "starting_point",
            "headerName": "Starting point",
            "method": get_value_or_dash,
        },
        {
            "id": "baseline",
            "headerName": "Baseline",
            "method": get_value_or_dash,
        },
        {
            "id": "number_of_enterprises_assisted",
            "headerName": "Number of enterprises assisted",
            "method": get_value_or_dash,
        },
        {
            "id": "number_of_enterprises",
            "headerName": "Number of enterprises",
            "method": get_value_or_dash,
        },
        {
            "id": "aggregated_consumption",
            "headerName": "Aggregated consumption",
            "method": get_value_or_dash,
        },
        {
            "id": "number_of_production_lines_assisted",
            "headerName": "Number of Production Lines assisted",
            "method": get_value_or_dash,
        },
        {
            "id": "cost_effectiveness_kg",
            "headerName": "Cost effectiveness (US$/ Kg)",
            "method": get_value_or_dash,
        },
        {
            "id": "cost_effectiveness_co2",
            "headerName": "Cost effectiveness (US$/ CO2-ep)",
            "method": get_value_or_dash,
        },
    ]
