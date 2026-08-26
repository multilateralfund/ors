"""
The 42 per-country metric declarations, and what each one is.

Every ``compute`` takes the request's :class:`MetricContext` and returns a
value, or ``None`` when there is nothing behind the figure. The context is
narrowed to one country, so these read the same primitives the fund-wide
figures do and get a country's worth of answer back.
"""

from functools import partial
from typing import Any

from core.api.dashboard_metrics import classify, placeholders, taxonomy
from core.api.dashboard_metrics.apr import CO2_PHASED_OUT_FIELDS, ODP_PHASED_OUT_FIELDS
from core.api.dashboard_metrics.classify import (
    HCFC,
    HFC,
    OTHER_ODS,
    ClassifiedProject,
)
from core.api.dashboard_metrics.context import MetricContext
from core.api.dashboard_metrics.primitives import (
    funds_pair,
    grouped,
    grouped_row,
    is_country_entry,
    phase_out,
    project_counts,
    totals,
)
from core.api.dashboard_metrics.registry import (
    Disposition,
    Kind,
    Metric,
    Unit,
    index_metrics,
)
from core.models.project import Project

ONGOING_STATUS_CODE = "ONG"

TOTAL_PHASE_OUT_ODP = "total_phase_out_odp_tonnes"
TOTAL_PHASE_OUT_CO2 = "total_phase_out_co2_tonnes"

# A project's roll-up and its own substance rows are the same figure computed
# twice; below this they are agreeing about a rounding difference.
ROLLUP_TOLERANCE = 0.01

# The API hands back the literal string on a few free-text rows.
ABSENT_TEXT = ("", "nan", "none")


def _entry(context: MetricContext) -> Any:
    """The country or region this payload describes."""
    return context.country


def _country(context: MetricContext) -> Any:
    """The country this payload describes, or ``None`` for an aggregate entry.

    Country attributes do not apply to the five regional and global entries:
    they are somewhere projects are booked, not somewhere with an ozone unit.
    """
    entry = _entry(context)
    return entry if entry is not None and is_country_entry(entry) else None


def _text(value: Any) -> str | None:
    """Free text, or ``None`` when it holds nothing worth showing."""
    if value is None or str(value).strip().lower() in ABSENT_TEXT:
        return None
    return str(value).strip()


def _theme_of(row: ClassifiedProject) -> str | None:
    """The country page's funding theme for one project, from its cluster."""
    cluster = row.project.cluster
    if cluster is None:
        return None
    return taxonomy.THEME_BY_CLUSTER_CODE.get(cluster.code)


def _substance_row_sums(project: Project) -> tuple[float, float]:
    """A project's phase-out as its own substance rows report it."""
    rows = project.ods_odp.all()
    return (
        float(sum(row.odp or 0 for row in rows)),
        float(sum(row.co2_mt or 0 for row in rows)),
    )


def scope_entry_type(context: MetricContext) -> str | None:
    """Whether this entry is a country or one of the aggregate regions."""
    entry = _entry(context)
    if entry is None:
        return None
    return "country" if is_country_entry(entry) else "region"


def scope_excluded_status(context: MetricContext) -> dict[str, Any]:
    """What the Transferred/Closed rule removed from every figure on this page."""
    return totals(context.excluded)


def scope_no_code(context: MetricContext) -> int:
    """Projects in scope carrying no project code.

    They sit inside the funding totals and outside the project count, which
    counts distinct codes and cannot see them.
    """
    return len([row for row in context.projects if not row.project.code])


def scope_rollup_mismatch(context: MetricContext) -> dict[str, Any]:
    """Phase-out a stale project roll-up hides, against the substance rows.

    Reported, never substituted. Every phase-out figure on this page reads the
    project-level column, and quietly swapping in the substance sum would put
    this page at odds with every other consumer of the same data.
    """
    rollup_odp = rollup_co2 = rows_odp = rows_co2 = 0.0
    affected = 0

    for row in context.projects:
        project = row.project
        odp, co2 = _substance_row_sums(project)
        project_odp = float(project.total_phase_out_odp_tonnes or 0)
        project_co2 = float(project.total_phase_out_co2_tonnes or 0)
        if (
            abs(odp - project_odp) <= ROLLUP_TOLERANCE
            and abs(co2 - project_co2) <= ROLLUP_TOLERANCE
        ):
            continue
        affected += 1
        rollup_odp += project_odp
        rollup_co2 += project_co2
        rows_odp += odp
        rows_co2 += co2

    return {
        "projects_affected": affected,
        "odp_project_rollup": round(rollup_odp, 2),
        "odp_substance_rows": round(rows_odp, 2),
        "co2_project_rollup": round(rollup_co2, 2),
        "co2_substance_rows": round(rows_co2, 2),
    }


def attr_country_name(context: MetricContext) -> str | None:
    """What this entry is called."""
    entry = _entry(context)
    return entry.name if entry else None


def attr_iso3(context: MetricContext) -> str | None:
    """The ISO3 code. Aggregate entries have none."""
    country = _country(context)
    return country.iso3 if country else None


def attr_region(context: MetricContext) -> str | None:
    """The region the country sits in. An aggregate entry is not under one."""
    return _text(classify.region_of(_entry(context)))


# The database stores the Kigali group as a bare roman numeral. The page names
# it in full, so it is spelled out here rather than in every client.
HFC_GROUP_LABELS = {"I": "Group 1", "II": "Group 2"}


def attr_hfc_group(context: MetricContext) -> str | None:
    """The country's Kigali consumption group."""
    country = _country(context)
    if country is None:
        return None
    return HFC_GROUP_LABELS.get(_text(country.consumption_group))


def attr_hcfc_lvc(context: MetricContext) -> str | None:
    """Whether the country is low-volume-consuming, for HCFC purposes."""
    return classify.lvc_status(_entry(context))


def attr_nou_ministry(context: MetricContext) -> str | None:
    """The ministry or office the national ozone unit sits in."""
    country = _country(context)
    return _text(country.ozone_unit) if country else None


def kf_projects_approved(context: MetricContext) -> int:
    """How many projects the country has had approved."""
    return project_counts(context.projects)["projects_by_code"]


def kf_projects_ongoing(context: MetricContext) -> int:
    """How many of them are still running."""
    return project_counts(context.with_status(ONGOING_STATUS_CODE))["projects_by_code"]


def kf_funding_disbursed(context: MetricContext) -> float | None:
    """What has actually been paid out to the country."""
    return context.apr.funds_disbursed()["all_time"] if context.apr else None


def kf_phased_out(context: MetricContext, fields: tuple[str, ...]) -> float | None:
    """What the reporting cycle says was removed, as against what was approved."""
    return context.apr.phased_out(fields) if context.apr else None


def trend_ods_consumption(context: MetricContext) -> list | None:
    """Reported consumption of ozone-depleting substances, year by year."""
    entry = _entry(context)
    return context.cp.consumption_odp(entry.name) if entry else None


def trend_hfc_consumption(context: MetricContext) -> list | None:
    """Reported consumption of hydrofluorocarbons, year by year."""
    entry = _entry(context)
    return context.cp.consumption_co2(entry.name) if entry else None


def trend_ods_production(context: MetricContext) -> list | None:
    """Reported production of ozone-depleting substances, year by year."""
    entry = _entry(context)
    return context.cp.production_odp(entry.name) if entry else None


def theme_funding(context: MetricContext) -> list[dict[str, Any]] | None:
    """Funding by theme, in the order the chart draws its bars.

    A project whose cluster has no theme is left out of the table and reported
    by :func:`theme_unmapped` instead, so the bars and the callout can be seen
    not to add up rather than quietly disagreeing.
    """
    table = grouped(context.projects, _theme_of)
    order = {theme: rank for rank, theme in enumerate(taxonomy.THEME_ORDER)}
    table.sort(key=lambda row: order.get(row["group"], len(order)))
    return table or None


def theme_total(context: MetricContext) -> float:
    """Everything approved for the country, which is the chart's callout figure."""
    return funds_pair(context.projects)["funds_plus_psc"]


def theme_unmapped(context: MetricContext) -> float:
    """Funding on projects whose cluster has no theme.

    It is inside the callout total and inside none of the bars.
    """
    return funds_pair([row for row in context.projects if not _theme_of(row)])[
        "funds_plus_psc"
    ]


def sector_tonnage(
    context: MetricContext, family: str | None, field: str
) -> list[dict[str, Any]] | None:
    """Phase-out by sector for one substance family, consumption projects only.

    ``family=None`` is the residual: the projects whose family neither their
    cluster nor their substances could settle. Every bucket is returned, zeros
    included, so the chart's slices stay put between countries - but a family
    that phases nothing out here has no chart at all.
    """
    rows = [
        row
        for row in context.projects
        if row.family_detail == family and not row.is_production
    ]
    buckets: dict[str, list[ClassifiedProject]] = {}
    for row in rows:
        buckets.setdefault(classify.country_sector_bucket(row.project), []).append(row)

    table = [
        {
            **grouped_row(bucket, buckets.get(bucket, [])),
            "tonnage": phase_out(buckets.get(bucket, []), field),
        }
        for bucket in classify.COUNTRY_SECTOR_ORDER
    ]
    return table if any(row["tonnage"] for row in table) else None


def prod_tonnage(context: MetricContext) -> float | None:
    """What the country's production projects take out of circulation.

    ``None`` where it has none: the page draws no production chart at all for
    those countries.
    """
    rows = [row for row in context.projects if row.is_production]
    return phase_out(rows, TOTAL_PHASE_OUT_ODP) if rows else None


COUNTRY_METRICS: tuple[Metric, ...] = (
    Metric(
        metric_id="scope_entry_type",
        label="Entry type",
        section="Scope & assumptions",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="country vs aggregate (Global / Europe / 'Region: …')",
        db_source="DB-COMPUTABLE",
        src_model_field="Country.location_type",
        compute=scope_entry_type,
    ),
    Metric(
        metric_id="scope_excluded_status",
        label="Projects excluded as Transferred or Closed",
        section="Scope & assumptions",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula=(
            "latest rows where status in (Transferred, Closed) - removed from EVERY "
            "figure below"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field="Project.status",
        compute=scope_excluded_status,
    ),
    Metric(
        metric_id="scope_no_code",
        label="Projects in scope with no project code",
        section="Scope & assumptions",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.COMPUTE,
        formula="latest, non-excluded rows where code is null",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.code",
        compute=scope_no_code,
    ),
    Metric(
        metric_id="scope_rollup_mismatch",
        label="Phase-out hidden by a stale project roll-up",
        section="Scope & assumptions",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula=(
            "projects where sum(Substances sheet per-substance phase-out) != Projects "
            "sheet 'Total phase-out'"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field=(
            "Project.total_phase_out_odp_tonnes / _co2_tonnes  vs  ProjectOdsOdp.odp "
            "/ .co2_mt"
        ),
        compute=scope_rollup_mismatch,
    ),
    Metric(
        metric_id="attr_country_name",
        label="Country name",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="dashboard export 'Country' column",
        db_source="DB-COMPUTABLE",
        src_model_field="Country.name",
        compute=attr_country_name,
    ),
    Metric(
        metric_id="attr_iso3",
        label="ISO3",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="dashboard export 'country_iso' column",
        db_source="DB-COMPUTABLE",
        src_model_field="Country.iso3",
        compute=attr_iso3,
    ),
    Metric(
        metric_id="attr_region",
        label="Region",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="dashboard export 'Region' column (drives the dynamic footer)",
        db_source="DB-COMPUTABLE",
        src_model_field="Country.parent chain",
        compute=attr_region,
    ),
    Metric(
        metric_id="attr_ods_licensing",
        label="ODS licensing system",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country attribute - does an ODS import/export licensing system exist",
        db_source="PENDING-COUNTRY-FIELD",
        src_model_field="Project.upgrade_of_imp_exp_licensing",
        compute=None,
        unavailable_reason=(
            "No country-level licensing field, the Country field is pending."
        ),
        placeholder=partial(
            placeholders.choice, slug="ods_licensing", labels=placeholders.YES_NO
        ),
    ),
    Metric(
        metric_id="attr_ods_quota",
        label="ODS quota system",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country attribute - does an ODS quota system exist",
        db_source="PENDING-COUNTRY-FIELD",
        src_model_field="Project.upgrade_of_quota_system",
        compute=None,
        unavailable_reason=(
            "No country-level quota field, the Country field is pending."
        ),
        placeholder=partial(
            placeholders.choice, slug="ods_quota", labels=placeholders.YES_NO
        ),
    ),
    Metric(
        metric_id="attr_hfc_licensing",
        label="HFC licensing system",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country attribute - HFC-specific licensing system",
        db_source="PENDING-COUNTRY-FIELD",
        src_model_field="none",
        compute=None,
        unavailable_reason=(
            "No HFC-specific licensing field exists, the Country field is pending."
        ),
        placeholder=partial(
            placeholders.choice, slug="hfc_licensing", labels=placeholders.YES_NO
        ),
    ),
    Metric(
        metric_id="attr_hfc_quota",
        label="HFC quota system",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country attribute - HFC-specific quota system",
        db_source="PENDING-COUNTRY-FIELD",
        src_model_field="none",
        compute=None,
        unavailable_reason=(
            "No HFC-specific quota field exists (no ODS/HFC split), the Country field is pending."
        ),
        placeholder=partial(
            placeholders.choice, slug="hfc_quota", labels=placeholders.YES_NO
        ),
    ),
    Metric(
        metric_id="attr_hfc_group",
        label="Country classification (HFC)",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="Country.consumption_group, labelled 'Group 1' / 'Group 2'",
        db_source="DB-COMPUTABLE",
        src_model_field="Country.consumption_group",
        compute=attr_hfc_group,
    ),
    Metric(
        metric_id="attr_hcfc_lvc",
        label="Country classification (HCFC)",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="Country.is_lvc, labelled 'LVC' / 'Non-LVC'",
        db_source="DB-COMPUTABLE",
        src_model_field="Country.is_lvc",
        compute=attr_hcfc_lvc,
    ),
    Metric(
        metric_id="attr_nou_ministry",
        label="NOU ministry",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE_PARTIAL,
        formula="Country.ozone_unit (free text - holds the ministry/office name)",
        db_source="DB-COMPUTABLE-AMBIGUOUS",
        src_model_field="Country.ozone_unit",
        compute=attr_nou_ministry,
    ),
    Metric(
        metric_id="attr_nou_name",
        label="NOU contact person",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country attribute - NOU contact person name",
        db_source="PENDING-COUNTRY-FIELD",
        src_model_field="none",
        compute=None,
        unavailable_reason=(
            "No contact-person field on Country, the Country field is pending."
        ),
        placeholder=placeholders.nou_name,
    ),
    Metric(
        metric_id="attr_certification",
        label="Competence certification system established",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country attribute - YES/NO",
        db_source="PENDING-COUNTRY-FIELD",
        src_model_field="Project.establishment_of_technician_certification",
        compute=None,
        unavailable_reason=("The Country field is pending."),
        placeholder=partial(
            placeholders.choice, slug="certification", labels=placeholders.YES_NO
        ),
    ),
    Metric(
        metric_id="attr_meps",
        label="MEPS from funded projects",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country attribute - YES/ESTABLISHED",
        db_source="PENDING-COUNTRY-FIELD",
        src_model_field="Project.meps_developed_domestic_refrigeration",
        compute=None,
        unavailable_reason=(
            "Settled as a country attribute; the Country field is pending."
        ),
        placeholder=partial(
            placeholders.choice, slug="meps", labels=placeholders.MEPS_LABELS
        ),
    ),
    Metric(
        metric_id="kf_projects_approved",
        label="Total number of projects approved",
        section="Key figures",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.COMPUTE,
        formula=(
            "count(distinct code), latest version, excluding status "
            "Transferred/Closed"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field="Project.code",
        compute=kf_projects_approved,
    ),
    Metric(
        metric_id="kf_projects_ongoing",
        label="Total number of projects ongoing",
        section="Key figures",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.COMPUTE,
        formula="count(distinct code) where status == Ongoing",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.status",
        compute=kf_projects_ongoing,
    ),
    Metric(
        metric_id="kf_funding_approved",
        label="Total funding approved",
        section="Key figures",
        kind=Kind.BREAKDOWN,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum(Project funding + PSC), latest version, excluding status "
            "Transferred/Closed"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_fund + support_cost_psc",
        compute=lambda context: funds_pair(context.projects),
    ),
    Metric(
        metric_id="kf_funding_disbursed",
        label="Total funding disbursed",
        section="Key figures",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="sum(Funds Disbursed (US$)) from the APR export for the country",
        db_source="NEEDS-APR",
        src_model_field="AnnualProjectReport.funds_disbursed",
        compute=kf_funding_disbursed,
    ),
    Metric(
        metric_id="kf_odp_phased",
        label="Total ODP phased out, actual",
        section="Key figures",
        kind=Kind.SCALAR,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum(Consumption Phased Out (ODP tonnes) + Production Phased Out (ODP "
            "tonnes)) from the APR"
        ),
        db_source="NEEDS-APR",
        src_model_field=(
            "AnnualProjectReport.consumption_phased_out_odp + "
            "production_phased_out_odp"
        ),
        compute=partial(kf_phased_out, fields=ODP_PHASED_OUT_FIELDS),
    ),
    Metric(
        metric_id="kf_odp_approved",
        label="Total ODP approved, planned",
        section="Key figures",
        kind=Kind.SCALAR,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula="sum(Total phase-out (ODP tonnes)) - the approved/planned total",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_phase_out_odp_tonnes",
        compute=lambda context: phase_out(context.projects, TOTAL_PHASE_OUT_ODP),
    ),
    Metric(
        metric_id="kf_co2_phased",
        label="Total CO2-eq phased out, actual",
        section="Key figures",
        kind=Kind.SCALAR,
        unit=Unit.CO2EQ_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum(Consumption Phased Out (CO2-eq tonnes) + Production Phased Out "
            "(CO2-eq tonnes)) from the APR"
        ),
        db_source="NEEDS-APR",
        src_model_field=(
            "AnnualProjectReport.consumption_phased_out_co2 + "
            "production_phased_out_co2"
        ),
        compute=partial(kf_phased_out, fields=CO2_PHASED_OUT_FIELDS),
    ),
    Metric(
        metric_id="kf_co2_approved",
        label="Total CO2-eq approved, planned",
        section="Key figures",
        kind=Kind.SCALAR,
        unit=Unit.CO2EQ_TONNES,
        disposition=Disposition.COMPUTE,
        formula="sum(Total phase-out (CO2-eq tonnes)) - the approved/planned total",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_phase_out_co2_tonnes",
        compute=lambda context: phase_out(context.projects, TOTAL_PHASE_OUT_CO2),
    ),
    Metric(
        metric_id="trend_ods_consumption",
        label="ODS consumption over time",
        section="Consumption & production trends",
        kind=Kind.SERIES,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula="per year: backend get_consumption_value over section-A records (ODP)",
        db_source="DB-COMPUTABLE-CP",
        src_model_field="CPRecord.imports/exports/production (section A)",
        compute=trend_ods_consumption,
    ),
    Metric(
        metric_id="trend_hfc_consumption",
        label="HFC consumption over time",
        section="Consumption & production trends",
        kind=Kind.SERIES,
        unit=Unit.CO2EQ_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "per year: backend get_consumption_value over Annex-F records "
            "(CO2-eq/GWP)"
        ),
        db_source="DB-COMPUTABLE-CP",
        src_model_field="CPRecord (Annex F)",
        compute=trend_hfc_consumption,
    ),
    Metric(
        metric_id="trend_ods_production",
        label="ODS production over time",
        section="Consumption & production trends",
        kind=Kind.SERIES,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "per year: sum of the 'production' metric over the country's CP records"
        ),
        db_source="DB-COMPUTABLE-CP",
        src_model_field="CPRecord.production",
        compute=trend_ods_production,
    ),
    Metric(
        metric_id="theme_funding",
        label="Funding by project theme",
        section="Funding by project theme",
        kind=Kind.TABLE,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula=(
            "group the country's projects by the Cluster→Aggregation map (Cluster "
            "list_ey copy.xlsx); sum funding+PSC"
        ),
        db_source="DB-COMPUTABLE-MAPPED",
        src_model_field="Project.cluster + Cluster list_ey copy.xlsx",
        compute=theme_funding,
    ),
    Metric(
        metric_id="theme_total",
        label="Total funding approved across all themes",
        section="Funding by project theme",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="sum(funding+PSC) over the country",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_fund + psc",
        compute=theme_total,
    ),
    Metric(
        metric_id="theme_unmapped",
        label="Funding on projects whose cluster has no theme",
        section="Funding by project theme",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="funding whose Cluster has no Aggregation in Cluster list_ey copy.xlsx",
        db_source="DB-COMPUTABLE-MAPPED",
        src_model_field="Project.cluster + Cluster list_ey copy.xlsx",
        compute=theme_unmapped,
    ),
    Metric(
        metric_id="sector_hfc",
        label="HFC tonnage approved by sector",
        section="Tonnage approved by sector",
        kind=Kind.TABLE,
        unit=Unit.CO2EQ_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum Projects-sheet 'Total phase-out (CO2-eq tonnes)' by Sector bucket, "
            "for projects whose substance family is HFC; consumption only"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field=(
            "Project.substance_type + Project.sector + "
            "Project.total_phase_out_co2_tonnes"
        ),
        compute=partial(sector_tonnage, family=HFC, field=TOTAL_PHASE_OUT_CO2),
    ),
    Metric(
        metric_id="sector_hcfc",
        label="HCFC tonnage approved by sector",
        section="Tonnage approved by sector",
        kind=Kind.TABLE,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum Projects-sheet 'Total phase-out (ODP tonnes)' by Sector bucket, for "
            "projects whose substance family is HCFC; consumption only"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field=(
            "Project.substance_type + Project.sector + "
            "Project.total_phase_out_odp_tonnes"
        ),
        compute=partial(sector_tonnage, family=HCFC, field=TOTAL_PHASE_OUT_ODP),
    ),
    Metric(
        metric_id="sector_other_ods",
        label="Other ODS tonnage approved by sector",
        section="Tonnage approved by sector",
        kind=Kind.TABLE,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum CFC / halon / CTC / TCA / methyl-bromide phase-out (ODP) by Sector "
            "bucket; consumption only"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field=(
            "Project.substance_type + Project.sector + "
            "Project.total_phase_out_odp_tonnes"
        ),
        compute=partial(sector_tonnage, family=OTHER_ODS, field=TOTAL_PHASE_OUT_ODP),
    ),
    Metric(
        metric_id="sector_unclassified",
        label="Tonnage on projects with no resolvable substance family",
        section="Tonnage approved by sector",
        kind=Kind.TABLE,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum phase-out (ODP) where neither substance_type nor Cluster resolves to "
            "HFC/HCFC/other-ODS"
        ),
        db_source="DB-COMPUTABLE-AMBIGUOUS",
        src_model_field="Project.substance_type / Project.cluster",
        compute=partial(sector_tonnage, family=None, field=TOTAL_PHASE_OUT_ODP),
    ),
    Metric(
        metric_id="prod_tonnage",
        label="Production tonnage phased out",
        section="Production & energy efficiency",
        kind=Kind.SCALAR,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum(Total phase-out (ODP tonnes)) over the country's production projects"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_phase_out_odp_tonnes (production)",
        compute=prod_tonnage,
    ),
    Metric(
        metric_id="ee_kwh_saved",
        label="Energy saved per year",
        section="Production & energy efficiency",
        kind=Kind.SCALAR,
        unit=Unit.KWH_PER_YEAR,
        disposition=Disposition.NOT_AVAILABLE,
        formula=(
            "sum(Projects sheet 'Energy savings - actual (kWh/year)') over the "
            "country's projects"
        ),
        db_source="IMPACT-UNPOPULATED",
        src_model_field=(
            'Project.energy_savings_actual  [export column: "Energy savings - actual '
            '(kWh/year)"; planned twin: "Energy savings - planned (kWh/year)"]'
        ),
        compute=None,
        unavailable_reason="Per-country data unavailable.",
        placeholder=partial(
            placeholders.count,
            slug="kwh",
            low=1_500_000,
            high=45_000_000,
            step=100_000,
        ),
    ),
    Metric(
        metric_id="impact_technicians",
        label="Technicians trained",
        section="Impact",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.NOT_AVAILABLE,
        formula=(
            "sum(Projects sheet 'Total number of technicians trained - actual') over "
            "the country's projects"
        ),
        db_source="IMPACT-UNPOPULATED",
        src_model_field=(
            "Project.total_number_of_technicians_trained_actual  [export column: "
            '"Total number of technicians trained - actual"]'
        ),
        compute=None,
        unavailable_reason="Per-country data unavailable.",
        placeholder=partial(placeholders.count, slug="technicians", low=150, high=3500),
    ),
    Metric(
        metric_id="impact_customs",
        label="Customs officers trained",
        section="Impact",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.NOT_AVAILABLE,
        formula=(
            "sum(Projects sheet 'Total number of customs officers trained - actual') "
            "over the country's projects"
        ),
        db_source="IMPACT-UNPOPULATED",
        src_model_field=(
            "Project.total_number_of_customs_officers_trained_actual  [export column: "
            '"Total number of customs officers trained - actual"]'
        ),
        compute=None,
        unavailable_reason="Per-country data unavailable.",
        placeholder=partial(placeholders.count, slug="customs", low=20, high=600),
    ),
    Metric(
        metric_id="impact_enterprises",
        label="Enterprises assisted",
        section="Impact",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.NOT_AVAILABLE,
        formula=(
            "sum of the three 'directly funded' actual columns (SMEs + non-SMEs + "
            "both-not-directly-funded)"
        ),
        db_source="IMPACT-UNPOPULATED",
        src_model_field=(
            "Project.number_of_smes_directly_funded_actual + "
            "number_of_non_sme_directly_funded_actual + "
            "number_of_both_sme_non_sme_not_directly_funded_actual  [export columns: "
            '"Number of SMEs directly funded - actual", "Number of non-SMEs directly '
            'funded - actual", "Number of both SMEs and non-SMEs included in the '
            'project but not directly funded - actual"]'
        ),
        compute=None,
        unavailable_reason="Per-country data unavailable.",
        placeholder=partial(placeholders.count, slug="enterprises", low=8, high=90),
    ),
    Metric(
        metric_id="impact_certification",
        label="Competence certification established",
        section="Impact",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country YES/NO",
        db_source="PENDING-COUNTRY-FIELD",
        src_model_field="Project.establishment_of_technician_certification",
        compute=None,
        unavailable_reason=(
            "Settled as a country attribute; the Country field is pending."
        ),
        placeholder=partial(
            placeholders.choice, slug="certification", labels=placeholders.YES_NO
        ),
    ),
    Metric(
        metric_id="impact_meps",
        label="MEPS established",
        section="Impact",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country ESTABLISHED",
        db_source="PENDING-COUNTRY-FIELD",
        src_model_field="Project.meps_developed_domestic_refrigeration",
        compute=None,
        unavailable_reason=(
            "Settled as a country attribute; the Country field is pending."
        ),
        placeholder=partial(
            placeholders.choice, slug="meps", labels=placeholders.MEPS_LABELS
        ),
    ),
)

COUNTRY_METRICS_BY_ID = index_metrics(COUNTRY_METRICS, "COUNTRY_METRICS")
