"""
The fund-wide metric declarations, and what each one is.

Every ``compute`` takes the request's :class:`MetricContext` and returns a
value, or ``None`` when there is nothing behind the figure.
"""

import math
from functools import partial
from typing import Any

from constance import config

from core.api.dashboard_metrics import classify, placeholders
from core.api.dashboard_metrics.classify import HCFC, HFC, ODS, OTHER_ODS
from core.api.dashboard_metrics.context import MetricContext
from core.api.dashboard_metrics.primitives import (
    count_project_grains,
    funds_pair,
    grouped,
    phase_out,
    totals,
)
from core.api.dashboard_metrics.registry import (
    Disposition,
    Kind,
    Metric,
    Unit,
    index_metrics,
)

COMPLETED_STATUS_CODES = ("COM", "FIN")
ONGOING_STATUS_CODES = ("ONG",)

# The ODS funding figure is about phase-out, so the money spent working out what
# to phase out and the money keeping an ozone unit open are left out of it.
ODS_FUNDING_EXCLUDED_TYPE_CODES = ("PRP", "INS")

# The portfolio headline is quoted to the nearest thousand, rounded down.
PORTFOLIO_ROUNDING = 1000


def static(value: Any):
    """A figure MLF supplies rather than one the database holds."""
    return lambda _context: value


def manual(key: str):
    """A figure an administrator types in in constance, unavailable until someone does."""

    def read(_context: MetricContext) -> float | None:
        value = getattr(config, key, None)
        return float(value) if value else None

    return read


def _project_type_code(row) -> str | None:
    project_type = row.project.project_type
    return project_type.code if project_type else None


def ods_phased_out(context: MetricContext) -> float:
    """Ozone-depleting substances removed, consumption and production together."""
    return phase_out(context.with_family(ODS), "total_phase_out_odp_tonnes")


def hfc_phased_out(context: MetricContext) -> float:
    """Hydrofluorocarbons removed, in CO2 tonnes"""
    return phase_out(context.with_family(HFC), "total_phase_out_co2_tonnes")


def ods_funding_approved(context: MetricContext) -> float:
    """What the phase-out of ozone-depleting substances was funded at."""
    rows = [
        row
        for row in context.with_family(ODS)
        if _project_type_code(row) not in ODS_FUNDING_EXCLUDED_TYPE_CODES
    ]
    return funds_pair(rows)["funds_plus_psc"]


def hfc_funding_approved(context: MetricContext) -> float:
    """What the phase-down of hydrofluorocarbons was funded at."""
    return funds_pair(context.with_family(HFC))["funds_plus_psc"]


def grant_funding_pledged(context: MetricContext) -> float | None:
    """Everything contributors have pledged to the Fund since it began."""
    return None if context.pledged is None else round(float(context.pledged), 2)


def funds_for(context: MetricContext, *status_codes: str) -> float:
    """Approved funding, including support costs, for one set of statuses."""
    return funds_pair(context.with_status(*status_codes))["funds_plus_psc"]


def count_for(context: MetricContext, *status_codes: str) -> int:
    """How many projects are in one set of statuses."""
    return count_project_grains(context.with_status(*status_codes))["projects_by_code"]


def portfolio_projects(context: MetricContext) -> int:
    """Every project the Fund has approved."""
    return count_project_grains(context.projects)["projects_by_code"]


def portfolio_projects_rounded(context: MetricContext) -> int:
    """The portfolio headline: the total, rounded down to the nearest thousand.

    Render it with a trailing ``+`` - it is deliberately an understatement.
    """
    return (
        math.floor(portfolio_projects(context) / PORTFOLIO_ROUNDING)
        * PORTFOLIO_ROUNDING
    )


def by_agency(context: MetricContext) -> list[dict[str, Any]]:
    """Delivery split across the agencies that implement the Fund's projects."""
    return classify.agency_rollup(context.projects)


def by_region(context: MetricContext) -> list[dict[str, Any]]:
    """Delivery split across the regions the portfolio is spread over.

    Every in-scope project lands in exactly one row, so the table sums to the
    fund. A project naming a region rather than one of its countries - Global
    among them - is charted under that region.
    """
    return grouped(
        context.projects, lambda row: classify.region_bucket(row.project.country)
    )


NOT_CLASSIFIED = "not_classified"

# The component each LVC status is reported under. Keyed on what
# ``classify.lvc_status`` returns, so the fund split and the country page's
# stated classification can never drift apart.
LVC_COMPONENTS = {
    classify.LVC: "lvc",
    classify.NON_LVC: "non_lvc",
    None: NOT_CLASSIFIED,
}


def _lvc_bucket(row) -> str:
    """The component a project's funding is reported under."""
    return LVC_COMPONENTS[classify.lvc_status(row.project.country)]


def funds_lvc_split(context: MetricContext) -> dict[str, Any]:
    """Funding split by LVC classification.

    ``not_classified`` is a named component rather than a silent remainder.
    """
    return {
        component: funds_pair(
            context.where(lambda row, name=component: _lvc_bucket(row) == name)
        )
        for component in LVC_COMPONENTS.values()
    }


def funds_disbursed_lvc_split(context: MetricContext) -> dict[str, Any] | None:
    """Disbursement split by LVC classification."""
    if context.apr is None:
        return None
    reported = context.apr.disbursed_grouped(
        lambda record: LVC_COMPONENTS[classify.lvc_status(record.project.country)]
    )
    empty = {"all_time": 0.0, "active_cycle": 0.0}
    return {
        component: reported.get(component, empty)
        for component in LVC_COMPONENTS.values()
    }


OTHER_ODS_PCT_PHASED_OUT = 100.0


def baseline_rows() -> list[dict[str, Any]]:
    """The baseline table's three rows, in chart order.

    HFC and HCFC are ``null``: the Protocol sets a baseline per country per
    substance group and ORS holds neither, so the percentage cannot be worked
    out. The rows are still served, so the chart keeps its shape and says
    "unknown" rather than disappearing - and ``null`` is not zero.
    """
    return [
        {"group": HFC, "value": None},
        {"group": HCFC, "value": None},
        {"group": OTHER_ODS, "value": OTHER_ODS_PCT_PHASED_OUT},
    ]


def baseline_phased_out_by_substance(_context: MetricContext) -> list[dict[str, Any]]:
    """Percentage of baseline consumption phased out, per substance family."""
    return baseline_rows()


def theme(context: MetricContext, name: str) -> dict[str, Any]:
    """One funding theme's share of the portfolio."""
    return totals(context.where(lambda row: row.theme == name))


def sector(context: MetricContext, bucket: str) -> dict[str, Any]:
    """One sector's share of the portfolio, and what has been paid out against it."""
    value = totals(context.where(lambda row: row.sector_bucket == bucket))
    disbursed = (
        classify.disbursed_by_bucket(context.apr.disbursed_by_sector_code())
        if context.apr
        else {}
    )
    value["funds_disbursed"] = (
        round(disbursed[bucket], 2) if bucket in disbursed else None
    )
    return value


def funds_disbursed(context: MetricContext) -> dict[str, float] | None:
    """What has actually been paid out, in total and within the current cycle."""
    return context.apr.funds_disbursed() if context.apr else None


def investment_timeline(context: MetricContext) -> dict[str, float | int | None] | None:
    """How long an investment project takes to start spending, and to finish."""
    if context.apr is None:
        return None
    records = context.apr.investment()
    return {
        "months_to_first_disbursement": context.apr.months_to_first_disbursement(
            records
        ),
        "months_to_completion": context.apr.months_to_completion(records),
    }


def inv_months_first_disb(context: MetricContext) -> float | None:
    """Months from approving an investment project to its first disbursement."""
    if context.apr is None:
        return None
    return context.apr.months_to_first_disbursement(context.apr.investment())


def inv_months_completion(context: MetricContext) -> float | None:
    """Months from approving an investment project to completing it."""
    if context.apr is None:
        return None
    return context.apr.months_to_completion(context.apr.investment())


def noninv_months_first_disb(context: MetricContext) -> float | None:
    """The same first-disbursement wait, for everything that is not investment."""
    if context.apr is None:
        return None
    return context.apr.months_to_first_disbursement(context.apr.non_investment())


def noninv_first_disbursement_scope(context: MetricContext) -> float | None:
    """The first-disbursement wait among those that have had a disbursement.

    The projects still waiting are excluded rather than counted as zero.
    """
    if context.apr is None:
        return None
    disbursing = [
        record
        for record in context.apr.non_investment()
        if record.funds_disbursed and record.funds_disbursed > 0
    ]
    return context.apr.months_to_first_disbursement(disbursing)


def noninv_months_completion(context: MetricContext) -> float | None:
    """Months from approving a non-investment project to completing it."""
    if context.apr is None:
        return None
    return context.apr.months_to_completion(context.apr.non_investment())


FUND_METRICS: tuple[Metric, ...] = (
    Metric(
        metric_id="ods_avoided_emissions",
        label="Total avoided emissions from ODS",
        section="From protecting the ozone layer to safeguarding climate and health",
        kind=Kind.SCALAR,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula="manual admin field",
        db_source="MANUAL-CONSTANCE",
        src_model_field="constance config TOTAL_AVOIDED_EMISSIONS_OF_ODS_IN_ODP_TONNES",
        compute=manual("TOTAL_AVOIDED_EMISSIONS_OF_ODS_IN_ODP_TONNES"),
    ),
    Metric(
        metric_id="controlled_substances_avoided_emissions",
        label="Total avoided emissions from controlled substances",
        section="From protecting the ozone layer to safeguarding climate and health",
        kind=Kind.SCALAR,
        unit=Unit.CO2EQ_TONNES,
        disposition=Disposition.COMPUTE,
        formula="manual admin field",
        db_source="MANUAL-CONSTANCE",
        src_model_field=(
            "constance "
            "TOTAL_AVOIDED_EMISSIONS_OF_CONTROLLED_SUBSTANCES_IN_CO2_EQ_TONNES "
            "(+EXPECTED_AVOIDED_EMISSIONS_FROM_HFCS_IN_CO2_EQ_TONNES)"
        ),
        compute=manual(
            "TOTAL_AVOIDED_EMISSIONS_OF_CONTROLLED_SUBSTANCES_IN_CO2_EQ_TONNES"
        ),
    ),
    Metric(
        metric_id="hfc_expected_avoided_emissions",
        label="Expected avoided emissions from HFCs",
        section="From protecting the ozone layer to safeguarding climate and health",
        kind=Kind.SCALAR,
        unit=Unit.CO2EQ_TONNES,
        disposition=Disposition.COMPUTE,
        formula="manual admin field",
        db_source="MANUAL-CONSTANCE",
        src_model_field=(
            "constance "
            "TOTAL_AVOIDED_EMISSIONS_OF_CONTROLLED_SUBSTANCES_IN_CO2_EQ_TONNES "
            "(+EXPECTED_AVOIDED_EMISSIONS_FROM_HFCS_IN_CO2_EQ_TONNES)"
        ),
        compute=manual("EXPECTED_AVOIDED_EMISSIONS_FROM_HFCS_IN_CO2_EQ_TONNES"),
    ),
    Metric(
        metric_id="savings_to_society",
        label="Total savings to society",
        section="From protecting the ozone layer to safeguarding climate and health",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="manual admin field",
        db_source="MANUAL-CONSTANCE",
        src_model_field="constance TOTAL_SAVINGS_TO_SOCIETY_IN_US_DOLLAR",
        compute=manual("TOTAL_SAVINGS_TO_SOCIETY_IN_US_DOLLAR"),
    ),
    Metric(
        metric_id="grant_funding_pledged",
        label="Grant funding pledged",
        section="Empowering the transition",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="external pledged contributions",
        db_source="EXTERNAL",
        src_model_field="none (pledged contributions)",
        compute=grant_funding_pledged,
    ),
    Metric(
        metric_id="ods_cost_per_odp_tonne",
        label="Cost to the Fund to remove one ODP tonne of ODS",
        section="Maximum impact minimum cost",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="manual admin field",
        db_source="MANUAL-CONSTANCE",
        src_model_field="constance COST_TO_THE_FUND_TO_REMOVE_1_ODP_TONNE_FROM_ODS",
        compute=manual("COST_TO_THE_FUND_TO_REMOVE_1_ODP_TONNE_FROM_ODS"),
    ),
    Metric(
        metric_id="controlled_substances_cost_per_co2eq_tonne",
        label="Cost to the Fund to remove one CO2-eq tonne of controlled substances",
        section="Maximum impact minimum cost",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="manual admin field",
        db_source="MANUAL-CONSTANCE",
        src_model_field=(
            "constance "
            "COST_TO_THE_FUND_TO_REMOVE_1_CO2_EQ_TONNE_FROM_CONTROLLED_SUBSTANCES"
        ),
        compute=manual(
            "COST_TO_THE_FUND_TO_REMOVE_1_CO2_EQ_TONNE_FROM_CONTROLLED_SUBSTANCES"
        ),
    ),
    Metric(
        metric_id="hfc_expected_cost_per_co2eq_tonne",
        label="Expected cost to the Fund to remove one CO2-eq tonne of HFCs",
        section="Maximum impact minimum cost",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="manual admin field",
        db_source="MANUAL-CONSTANCE",
        src_model_field=(
            "constance EXPECTED_COST_TO_THE_FUND_TO_REMOVE_1_CO2_EQ_TONNE_FROM_HFCS"
        ),
        compute=manual("EXPECTED_COST_TO_THE_FUND_TO_REMOVE_1_CO2_EQ_TONNE_FROM_HFCS"),
    ),
    Metric(
        metric_id="ods_phased_out",
        label="ODS phased out",
        section="Real reductions lasting results",
        kind=Kind.SCALAR,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum(Total phase-out (ODP tonnes)) over is_ods projects (dashboard "
            "export; incl. production)"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_phase_out_odp_tonnes",
        compute=ods_phased_out,
    ),
    Metric(
        metric_id="ods_funding_approved",
        label="Grant funding behind ODS phase-out",
        section="Real reductions lasting results",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula=(
            "Sum approved funding over is_ods AND Type not in {Preparation; "
            "Institutional strengthening}"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_fund + support_cost_psc, filtered is_ods",
        compute=ods_funding_approved,
    ),
    Metric(
        metric_id="hfc_phased_out",
        label="HFCs phased out",
        section="Real reductions lasting results",
        kind=Kind.SCALAR,
        unit=Unit.CO2EQ_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum(Total phase-out (CO2-eq tonnes)) over is_hfc projects (dashboard "
            "export; incl. production)"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_phase_out_co2_tonnes",
        compute=hfc_phased_out,
    ),
    Metric(
        metric_id="hfc_funding_approved",
        label="Grant funding behind HFC phase-out",
        section="Real reductions lasting results",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="Sum approved funding over is_hfc projects",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_fund + support_cost_psc, filtered is_hfc",
        compute=hfc_funding_approved,
    ),
    Metric(
        metric_id="baseline_phased_out_by_substance",
        label="Baseline consumption phased out, by substance",
        section="Percentage of baseline consumption phased out by substance (%)",
        kind=Kind.TABLE,
        unit=Unit.PERCENT,
        disposition=Disposition.COMPUTE_PARTIAL,
        formula=(
            "phased_out / baseline per family; Other ODS is a real 100%, HFC and "
            "HCFC do not have baselines yet"
        ),
        db_source="EXTERNAL",
        src_model_field=("numerator ProjectOdsOdp.odp by family; denominator not held"),
        compute=baseline_phased_out_by_substance,
        placeholder=partial(placeholders.fill_baseline, rows=baseline_rows),
    ),
    Metric(
        metric_id="pct_countries_met",
        label="Countries meeting their targets",
        section="National implementation and reach",
        kind=Kind.SCALAR,
        unit=Unit.PERCENT,
        disposition=Disposition.STATIC,
        formula="hardcoded",
        db_source="MANUAL",
        src_model_field="none",
        compute=static(95),
    ),
    Metric(
        metric_id="countries_capacity",
        label="Countries receiving capacity-building support",
        section="Building capacity strengthening compliance",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.STATIC,
        formula="hardcoded",
        db_source="MANUAL",
        src_model_field="none",
        compute=static(120),
    ),
    Metric(
        metric_id="countries_assisted",
        label="Countries assisted",
        section="National implementation and reach",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.STATIC,
        formula="hardcoded",
        db_source="DB-COMPUTABLE",
        src_model_field=(
            "distinct Project.country where Country.location_type='Country'"
        ),
        compute=static(144),
    ),
    Metric(
        metric_id="funds_approved",
        label="Funds approved",
        section="Targeted support for developing countries",
        kind=Kind.BREAKDOWN,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="Sum (funds approved + PSC) over latest codes",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_fund + support_cost_psc",
        compute=lambda context: funds_pair(context.projects),
    ),
    Metric(
        metric_id="funds_lvc_split",
        label="Funds approved by LVC status",
        section="Targeted support for developing countries",
        kind=Kind.BREAKDOWN,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula=("Sum (funds+PSC) grouped by classify.lvc_status"),
        db_source="DB-COMPUTABLE",
        src_model_field=("Country.is_lvc"),
        compute=funds_lvc_split,
    ),
    Metric(
        metric_id="funds_disbursed_lvc_split",
        label="Funds disbursed by LVC status",
        section="Targeted support for developing countries",
        kind=Kind.BREAKDOWN,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula=("sum(Funds Disbursed (US$)) grouped by classify.lvc_status"),
        db_source="NEEDS-APR",
        src_model_field="AnnualProjectReport.funds_disbursed by Country.is_lvc",
        compute=funds_disbursed_lvc_split,
    ),
    Metric(
        metric_id="funds_disbursed",
        label="Funds disbursed",
        section="Targeted support for developing countries",
        kind=Kind.BREAKDOWN,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum(Funds Disbursed (US$)) over the full APR export (status= → all "
            "statuses); active-cycle = ONG+COM subset"
        ),
        db_source="NEEDS-APR",
        src_model_field="AnnualProjectReport.funds_disbursed",
        compute=funds_disbursed,
    ),
    Metric(
        metric_id="projects_approved_total",
        label="Total number of projects",
        section="Total number of projects",
        kind=Kind.BREAKDOWN,
        unit=Unit.COUNT,
        disposition=Disposition.COMPUTE,
        formula="count(distinct code) where status not in {Transferred; Closed}",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.code, Project.status",
        compute=lambda context: count_project_grains(context.projects),
    ),
    Metric(
        metric_id="completed_count",
        label="Completed projects",
        section="Completed projects and amount of funds approved",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.COMPUTE,
        formula="count(code) where status in {Completed; Financially completed}",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.code, Project.status",
        compute=lambda context: count_for(context, *COMPLETED_STATUS_CODES),
    ),
    Metric(
        metric_id="completed_funding",
        label="Funding approved for completed projects",
        section="Completed projects and amount of funds approved",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="Sum funding over the #22 completed set",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_fund+psc filtered completed",
        compute=lambda context: funds_for(context, *COMPLETED_STATUS_CODES),
    ),
    Metric(
        metric_id="completed_end_year",
        label="Most recent reporting year",
        section="Completed projects and amount of funds approved",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="latest endorsed APR year",
        db_source="NEEDS-APR",
        src_model_field="AnnualProgressReport.year (max)",
        compute=lambda context: context.apr_year,
    ),
    Metric(
        metric_id="ongoing_count",
        label="Ongoing projects",
        section="Ongoing projects and amount of funds approved",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.COMPUTE,
        formula="count(code) where status == Ongoing",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.code, Project.status",
        compute=lambda context: count_for(context, *ONGOING_STATUS_CODES),
    ),
    Metric(
        metric_id="ongoing_funding",
        label="Funding approved for ongoing projects",
        section="Ongoing projects and amount of funds approved",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="Sum funding over ongoing set",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_fund+psc filtered ongoing",
        compute=lambda context: funds_for(context, *ONGOING_STATUS_CODES),
    ),
    Metric(
        metric_id="by_agency",
        label="Projects and funding by agency",
        section="Global partnerships for project delivery",
        kind=Kind.TABLE,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="groupby per-component 'Agency'; count codes + Sum funding",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.agency (per-component) -> Agency.name",
        compute=by_agency,
    ),
    Metric(
        metric_id="investment_timeline",
        label="Investment project timeline",
        section="Timeline for investment projects",
        kind=Kind.BREAKDOWN,
        unit=Unit.MONTHS,
        disposition=Disposition.COMPUTE,
        formula=(
            "avg(first disbursement - approved) & avg completion duration; "
            "Type=Investment"
        ),
        db_source="NEEDS-APR",
        src_model_field=(
            "AnnualProjectReport.date_first_disbursement + date_approved_denorm "
            "(computed avg)"
        ),
        compute=investment_timeline,
    ),
    Metric(
        metric_id="inv_months_first_disb",
        label="Months to first disbursement, investment projects",
        section="Timeline for investment projects",
        kind=Kind.SCALAR,
        unit=Unit.MONTHS,
        disposition=Disposition.COMPUTE,
        formula="avg(first disbursement - approved) Type=Investment",
        db_source="NEEDS-APR",
        src_model_field="AnnualProjectReport.date_first_disbursement",
        compute=inv_months_first_disb,
    ),
    Metric(
        metric_id="inv_months_completion",
        label="Months to completion, investment projects",
        section="Timeline for investment projects",
        kind=Kind.SCALAR,
        unit=Unit.MONTHS,
        disposition=Disposition.COMPUTE,
        formula="avg completion duration from inventory Type=Investment",
        db_source="NEEDS-APR",
        src_model_field=(
            "AnnualProjectReport.date_actual_completion / date_approved_denorm"
        ),
        compute=inv_months_completion,
    ),
    Metric(
        metric_id="noninv_first_disbursement_scope",
        label=(
            "Months to first disbursement, non-investment projects with at "
            "least one disbursement"
        ),
        section="Timeline for non-investment projects",
        kind=Kind.SCALAR,
        unit=Unit.MONTHS,
        disposition=Disposition.COMPUTE,
        formula=(
            "avg(first disbursement - approved); non-Investment; >=1 disbursement "
            "only"
        ),
        db_source="NEEDS-APR",
        src_model_field="AnnualProjectReport.funds_disbursed + date_first_disbursement",
        compute=noninv_first_disbursement_scope,
    ),
    Metric(
        metric_id="noninv_months_first_disb",
        label="Months to first disbursement, non-investment projects",
        section="Timeline for non-investment projects",
        kind=Kind.SCALAR,
        unit=Unit.MONTHS,
        disposition=Disposition.COMPUTE,
        formula="avg(first disbursement - approved) non-Investment",
        db_source="NEEDS-APR",
        src_model_field="AnnualProjectReport.date_first_disbursement",
        compute=noninv_months_first_disb,
    ),
    Metric(
        metric_id="noninv_months_completion",
        label="Months to completion, non-investment projects",
        section="Timeline for non-investment projects",
        kind=Kind.SCALAR,
        unit=Unit.MONTHS,
        disposition=Disposition.COMPUTE,
        formula="avg completion duration from inventory non-Investment",
        db_source="NEEDS-APR",
        src_model_field=(
            "AnnualProjectReport.date_actual_completion / date_approved_denorm"
        ),
        compute=noninv_months_completion,
    ),
    Metric(
        metric_id="portfolio_projects",
        label="Projects in the portfolio",
        section="Our project portfolio",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.COMPUTE,
        formula="same source as #37",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.code (all)",
        compute=portfolio_projects,
    ),
    Metric(
        metric_id="countries_portfolio",
        label="Developing countries in the portfolio",
        section="Our project portfolio",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.STATIC,
        formula="hardcoded",
        db_source="MANUAL",
        src_model_field="none",
        compute=static(144),
    ),
    Metric(
        metric_id="portfolio_projects_rounded",
        label="Portfolio total, rounded down to the nearest thousand",
        section="10K+ TOTAL NUMBER OF PROJECTS",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.COMPUTE,
        formula="count(distinct LATEST code) floor to nearest 1000 append '+'",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.code (latest)",
        compute=portfolio_projects_rounded,
    ),
    Metric(
        metric_id="by_region",
        label="Projects and funding by region",
        section="From global commitments to regional action",
        kind=Kind.TABLE,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="count codes by region + Sum funding",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.code by Region (Country.parent chain)",
        compute=by_region,
    ),
    Metric(
        metric_id="theme_consumption",
        label="Consumption projects",
        section="Consumption projects",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="residual theme (first-match-wins; Consumption last)",
        db_source="DB-COMPUTABLE-MESSY",
        src_model_field="Project classification (residual)",
        compute=partial(theme, name=classify.THEME_CONSUMPTION),
    ),
    Metric(
        metric_id="theme_production",
        label="Production projects",
        section="Production projects",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="Production flag",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.production / cluster / sector",
        compute=partial(theme, name=classify.THEME_PRODUCTION),
    ),
    Metric(
        metric_id="theme_ee",
        label="Energy efficiency projects",
        section="Energy efficiency projects",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="EE cluster OR funding window in {89/6;91/65;94/60;95/87}",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.cluster / Funding window",
        compute=partial(theme, name=classify.THEME_ENERGY_EFFICIENCY),
    ),
    Metric(
        metric_id="theme_disposal",
        label="Disposal projects",
        section="Disposal projects",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="Disposal type/cluster OR funding window 91/66",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.cluster/sector / Funding window",
        compute=partial(theme, name=classify.THEME_DISPOSAL),
    ),
    Metric(
        metric_id="theme_hfc23",
        label="HFC-23 projects",
        section="HFC-23 projects",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="Emission Control cluster",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.cluster (Emission Control)",
        compute=partial(theme, name=classify.THEME_HFC23),
    ),
    Metric(
        metric_id="theme_is",
        label="Institutional strengthening projects",
        section="Institutional strengthening projects",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="Type == Institutional strengthening",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.project_type (IS)",
        compute=partial(theme, name=classify.THEME_INSTITUTIONAL_STRENGTHENING),
    ),
    Metric(
        metric_id="sector_ac",
        label="Air-conditioning projects",
        section="Air-conditioning projects",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="count + Sum approved funding by sector=AC; disbursed NOT AVAILABLE",
        db_source="DB-COMPUTABLE+NEEDS-APR",
        src_model_field=(
            "approved: Project.total_fund by sector; disbursed: "
            "AnnualProjectReport.funds_disbursed by project.sector"
        ),
        compute=partial(sector, bucket=classify.SECTOR_AIR_CONDITIONING),
    ),
    Metric(
        metric_id="sector_ref",
        label="Refrigeration projects",
        section="Refrigeration projects",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="count + Sum approved funding; disbursed NOT AVAILABLE",
        db_source="DB-COMPUTABLE+NEEDS-APR",
        src_model_field="(same as #47)",
        compute=partial(sector, bucket=classify.SECTOR_REFRIGERATION),
    ),
    Metric(
        metric_id="sector_srv",
        label="Servicing projects",
        section="Servicing projects",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="count + Sum approved funding; disbursed NOT AVAILABLE",
        db_source="DB-COMPUTABLE+NEEDS-APR",
        src_model_field="(same as #47)",
        compute=partial(sector, bucket=classify.SECTOR_SERVICING),
    ),
    Metric(
        metric_id="sector_foam",
        label="Foam projects",
        section="Foam projects",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="count + Sum approved funding; disbursed NOT AVAILABLE",
        db_source="DB-COMPUTABLE+NEEDS-APR",
        src_model_field="(same as #47)",
        compute=partial(sector, bucket=classify.SECTOR_FOAM),
    ),
    Metric(
        metric_id="sector_aerosol",
        label="Aerosol projects",
        section="Aerosol projects",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="count + Sum approved funding; disbursed NOT AVAILABLE",
        db_source="DB-COMPUTABLE+NEEDS-APR",
        src_model_field="(same as #47)",
        compute=partial(sector, bucket=classify.SECTOR_AEROSOL),
    ),
    Metric(
        metric_id="sector_solvent",
        label="Solvent projects",
        section="Solvent projects",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="count + Sum approved funding; disbursed NOT AVAILABLE",
        db_source="DB-COMPUTABLE+NEEDS-APR",
        src_model_field="(same as #47)",
        compute=partial(sector, bucket=classify.SECTOR_SOLVENT),
    ),
)

FUND_METRICS_BY_ID = index_metrics(FUND_METRICS, "FUND_METRICS")
