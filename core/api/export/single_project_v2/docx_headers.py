from typing import List

from core.api.export.base import HeaderType
from core.api.export.single_project_v2.helpers import get_date_value
from core.api.export.single_project_v2.helpers import get_dollar_value
from core.api.export.single_project_v2.helpers import get_value_or_dash


def get_headers_metaproject() -> List[HeaderType]:
    return [
        {
            "id": "project_funding",
            "headerName": "MYA Total agreed funding in principle (US $)",
            "method": get_dollar_value,
        },
        {
            "id": "support_cost",
            "headerName": "MYA Total support costs in principle (US $)",
            "method": get_dollar_value,
        },
        {
            "id": "project_cost",
            "headerName": "MYA Total agreed costs in principle (US $)",
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
            "id": "project_duration",
            "headerName": "Project duration (months)",
            "method": get_value_or_dash,
        },
        {
            "id": "phase_out_co2_eq_t",
            "headerName": "Phase-out (CO2-eq tonnes) (MYA)",
            "method": get_value_or_dash,
        },
        {
            "id": "phase_out_odp",
            "headerName": "Phase-out (ODP tonnes) (MYA)",
            "method": get_value_or_dash,
        },
        {
            "id": "phase_out_mt",
            "headerName": "Phase-out (metric tonnes) (MYA)",
            "method": get_value_or_dash,
        },
        {
            "id": "target_reduction",
            "headerName": "Target in the last year (reduction in %)",
            "method": get_value_or_dash,
        },
        {
            "id": "target_co2_eq_t",
            "headerName": "Target in the last year (CO2-eq tonnes)",
            "method": get_value_or_dash,
        },
        {
            "id": "target_odp",
            "headerName": "Target in the last year (ODP tonnes)",
            "method": get_value_or_dash,
        },
        {
            "id": "starting_point_odp",
            "headerName": "Starting point for aggregate reductions in consumption or production (ODP tonnes)",
            "method": get_value_or_dash,
        },
        {
            "id": "starting_point_co2_eq_t",
            "headerName": "Starting point for aggregate reductions in consumption or production (CO2-eq tonnes)",
            "method": get_value_or_dash,
        },
        {
            "id": "baseline_odp",
            "headerName": "Baseline (ODP tonnes)",
            "method": get_value_or_dash,
        },
        {
            "id": "baseline_co2_eq_t",
            "headerName": "Baseline (CO2-eq tonnes)",
            "method": get_value_or_dash,
        },
        {
            "id": "number_of_smes_directly_funded",
            "headerName": "Number of SMEs directly funded",
            "method": get_value_or_dash,
        },
        {
            "id": "number_of_non_sme_directly_funded",
            "headerName": "Number of non-SMEs directly funded",
            "method": get_value_or_dash,
        },
        {
            "id": "number_of_both_sme_non_sme_not_directly_funded",
            "headerName": "Number of both SMEs and non-SMEs included in the project but not directly funded",
            "method": get_value_or_dash,
        },
        {
            "id": "number_of_production_lines_assisted",
            "headerName": "Production sector: number of production lines assisted",
            "method": get_value_or_dash,
        },
        {
            "id": "cost_effectiveness_kg",
            "headerName": "Cost effectiveness (US $/kg)",
            "method": get_value_or_dash,
        },
        {
            "id": "cost_effectiveness_co2",
            "headerName": "Cost effectiveness (US $/CO2-eq tonnes)",
            "method": get_value_or_dash,
        },
    ]
