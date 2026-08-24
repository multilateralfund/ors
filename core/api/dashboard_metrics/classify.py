"""
Theme, substance-family and sector bucketing, and the agency roll-up.

Everything here is keyed on a stable ``code``, never on a display name. A
rename upstream would otherwise empty a headline figure in silence.

See ``docs/dashboard_metrics.md``.
"""

import logging
from typing import Any, Iterable, NamedTuple, Sequence

from core.api.dashboard_metrics.primitives import grouped
from core.models.agency import Agency
from core.models.country import Country
from core.models.funding_window import FundingWindow
from core.models.project import Project

logger = logging.getLogger(__name__)

HFC = "HFC"
ODS = "ODS"
HCFC = "HCFC"
OTHER_ODS = "OTHER_ODS"

# The clusters that decide a project's substance family. Cluster is the primary
# signal, not a fallback: it is curated, it covers the whole portfolio, and it
# reproduces the published figures. Project.substance_type is read nowhere -
# it is deprecated and null on roughly two thirds of the projects.
HFC_CLUSTER_CODES = frozenset(
    {"HFCIND", "KIP1", "KIP2", "KIP3", "KPP1", "KPP2", "KPP3", "EC 1"}
)
HCFC_CLUSTER_CODES = frozenset(
    {
        "HCFCIND",
        "HPMP1",
        "HPMP2",
        "HPMP3",
        "HPMP4",
        "HPPMP1",
        "HPPMP2",
        "HPPMP3",
    }
)
OTHER_ODS_CLUSTER_CODES = frozenset({"CFCIND", "CPOP", "CPPOP", "OOI", "OOSP", "OOPPP"})
# ODS means every substance with an ozone-depletion potential. It is the union
# of the two above and must stay the union: the fund-wide phase-out figure is
# quoted over all of it.
ODS_CLUSTER_CODES = HCFC_CLUSTER_CODES | OTHER_ODS_CLUSTER_CODES

FAMILY_BY_CLUSTER_CODE = {
    **{code: HFC for code in HFC_CLUSTER_CODES},
    **{code: HCFC for code in HCFC_CLUSTER_CODES},
    **{code: OTHER_ODS for code in OTHER_ODS_CLUSTER_CODES},
}

# Read only when the cluster says nothing. Annex F is the HFC annex; A, B, C and
# E are the ozone-depleting ones, and Annex C Group I is the HCFCs within them.
HFC_ANNEXES = frozenset({"F"})
ODS_ANNEXES = frozenset({"A", "B", "C", "E"})
HCFC_GROUP_IDS = frozenset({"CI"})

PRODUCTION_SECTOR_CODES = frozenset({"PRO"})
EE_CLUSTER_CODES = frozenset({"EE"})
EE_WINDOW_CODES = frozenset({"89/6", "91/65", "94/60", "95/87"})
DISPOSAL_CLUSTER_CODES = frozenset({"DISP"})
DISPOSAL_SECTOR_CODES = frozenset({"DES"})
DISPOSAL_WINDOW_CODES = frozenset({"91/66"})
HFC23_CLUSTER_CODES = frozenset({"EC 1"})
IS_TYPE_CODES = frozenset({"INS"})

THEME_CONSUMPTION = "Consumption"
THEME_PRODUCTION = "Production"
THEME_ENERGY_EFFICIENCY = "Energy efficiency"
THEME_DISPOSAL = "Disposal"
THEME_HFC23 = "HFC-23"
THEME_INSTITUTIONAL_STRENGTHENING = "Institutional strengthening"

# These six are the fund-wide page's themes. They are NOT taxonomy.THEME_ORDER,
# which is the nine-theme cluster map the per-country page charts.
THEME_ORDER = (
    THEME_CONSUMPTION,
    THEME_PRODUCTION,
    THEME_ENERGY_EFFICIENCY,
    THEME_DISPOSAL,
    THEME_HFC23,
    THEME_INSTITUTIONAL_STRENGTHENING,
)

SECTOR_AIR_CONDITIONING = "Air-conditioning"
SECTOR_REFRIGERATION = "Refrigeration"
SECTOR_SERVICING = "Servicing"
SECTOR_FOAM = "Foam"
SECTOR_AEROSOL = "Aerosol"
SECTOR_SOLVENT = "Solvent"

# Servicing takes both SRV and the servicing/energy-efficiency sector. Sectors
# absent from this map are outside the six the page charts.
SECTOR_BUCKET_BY_CODE = {
    "AC": SECTOR_AIR_CONDITIONING,
    "REF": SECTOR_REFRIGERATION,
    "SRV": SECTOR_SERVICING,
    "SRVEE": SECTOR_SERVICING,
    "FOA": SECTOR_FOAM,
    "ARS": SECTOR_AEROSOL,
    "SOL": SECTOR_SOLVENT,
}

SECTOR_ORDER = (
    SECTOR_AIR_CONDITIONING,
    SECTOR_REFRIGERATION,
    SECTOR_SERVICING,
    SECTOR_FOAM,
    SECTOR_AEROSOL,
    SECTOR_SOLVENT,
)

# The per-country page charts a different set: five named sectors and a residual
# that is a bucket in its own right rather than a drop. Solvent has no bar of its
# own there and falls into the residual with everything else.
SECTOR_OTHER = "Other sectors"
COUNTRY_SECTOR_BUCKETS = frozenset(
    {
        SECTOR_AIR_CONDITIONING,
        SECTOR_REFRIGERATION,
        SECTOR_FOAM,
        SECTOR_AEROSOL,
        SECTOR_SERVICING,
    }
)
COUNTRY_SECTOR_ORDER = (
    SECTOR_AIR_CONDITIONING,
    SECTOR_REFRIGERATION,
    SECTOR_FOAM,
    SECTOR_AEROSOL,
    SECTOR_SERVICING,
    SECTOR_OTHER,
)

# Each of these gets its own row; everything else sums into one. WMO is an
# implementer-in-waiting and is simply absent until it has projects.
IMPLEMENTING_AGENCY_NAMES = ("UNDP", "UNEP", "UNIDO", "World Bank", "WMO")
BILATERAL_LABEL = "Bilateral Agencies"


class ClassifiedProject(NamedTuple):
    """One project with the buckets it belongs to, worked out once."""

    project: Project
    family: str | None
    family_detail: str | None
    theme: str
    sector_bucket: str | None
    is_production: bool


def window_code(window: FundingWindow) -> str | None:
    """The window's identifier, e.g. ``"91/65"``.

    A window is named by its decision, prefixed with the meeting number when the
    decision does not carry one. Some rows record the identifier in
    ``description`` instead, so that is the fallback.
    """
    from_decision = _decision_code(window.decision)
    from_description = str(window.description or "").strip() or None

    if from_decision and from_description and from_decision != from_description:
        logger.warning(
            "Dashboard metrics: funding window %s is named %r by its decision and "
            "%r by its description; the decision wins, and the projects on this "
            "window are themed accordingly.",
            window.id,
            from_decision,
            from_description,
        )
    return from_decision or from_description


def funding_window_codes() -> dict[int, str]:
    """``{funding window id: code}`` for every window, in one query.

    Built once per payload: there are a handful of windows and thousands of
    projects, and a contradictory window is worth saying once.
    """
    windows = FundingWindow.objects.select_related("decision__meeting")
    codes = {window.id: window_code(window) for window in windows}
    return {window_id: code for window_id, code in codes.items() if code}


def _decision_code(decision: Any) -> str | None:
    """Get decision code (e.g. ``"91/65"``) from a decision, adding the meeting number
    if it is missing.
    """
    if decision is None:
        return None
    number = str(decision.number or "").strip()
    if not number:
        return None
    if "/" in number or decision.meeting is None:
        return number
    return f"{decision.meeting.number}/{number}"


def substance_groups(project: Project) -> list[Any]:
    """The annex groups of the substances a project addresses."""
    return [
        ods.ods_substance.group
        for ods in project.ods_odp.all()
        if ods.ods_substance and ods.ods_substance.group
    ]


def substance_family_detail(project: Project) -> str | None:
    """``"HFC"``, ``"HCFC"``, ``"OTHER_ODS"``, or ``None`` for none of them.

    The per-country page charts HCFCs separately from the pre-HCFC-era
    substances, so the family is resolved three ways here and folded back to two
    by :func:`substance_family`.
    """
    code = project.cluster.code if project.cluster else None
    from_cluster = FAMILY_BY_CLUSTER_CODE.get(code)
    if from_cluster:
        return from_cluster

    groups = substance_groups(project)
    annexes = {group.annex for group in groups}
    if annexes & HFC_ANNEXES:
        return HFC
    if {group.group_id for group in groups} & HCFC_GROUP_IDS:
        return HCFC
    return OTHER_ODS if annexes & ODS_ANNEXES else None


def substance_family(project: Project) -> str | None:
    """``"ODS"``, ``"HFC"``, or ``None`` for a project that is neither.

    ``ODS`` covers everything with an ozone-depletion potential, HCFCs
    included - the fund-wide figures split two ways because their two headline
    numbers are in different units, ODP tonnes against CO2-eq tonnes.
    """
    detail = substance_family_detail(project)
    if detail in (HCFC, OTHER_ODS):
        return ODS
    return detail


def is_production(project: Project) -> bool:
    """Whether the project phases out production rather than consumption.

    Three signals, any of which is enough. ``ProjectCluster.production`` is null
    on clusters that allow both, which is not a production project on its own.
    """
    if project.production:
        return True
    if project.sector and project.sector.code in PRODUCTION_SECTOR_CODES:
        return True
    return bool(project.cluster and project.cluster.production)


def project_theme(
    project: Project, production: bool, window_codes: dict[int, str] | None = None
) -> str:
    """The funding theme. First match wins; Consumption is the residual."""
    if production:
        return THEME_PRODUCTION

    cluster_code = project.cluster.code if project.cluster else None
    sector_code = project.sector.code if project.sector else None
    window = (window_codes or funding_window_codes()).get(project.funding_window_id)

    if cluster_code in EE_CLUSTER_CODES or window in EE_WINDOW_CODES:
        return THEME_ENERGY_EFFICIENCY
    if (
        cluster_code in DISPOSAL_CLUSTER_CODES
        or sector_code in DISPOSAL_SECTOR_CODES
        or window in DISPOSAL_WINDOW_CODES
    ):
        return THEME_DISPOSAL
    if cluster_code in HFC23_CLUSTER_CODES:
        return THEME_HFC23
    if project.project_type and project.project_type.code in IS_TYPE_CODES:
        return THEME_INSTITUTIONAL_STRENGTHENING
    return THEME_CONSUMPTION


def sector_bucket(project: Project) -> str | None:
    """One of the six charted sectors, or ``None`` for the rest of them."""
    if not project.sector:
        return None
    return SECTOR_BUCKET_BY_CODE.get(project.sector.code)


def country_sector_bucket(project: Project) -> str:
    """One of the six the per-country page charts, residual included.

    Every project lands somewhere: this chart has no drop, and Solvent is part
    of the residual rather than a bar of its own.
    """
    bucket = sector_bucket(project)
    return bucket if bucket in COUNTRY_SECTOR_BUCKETS else SECTOR_OTHER


def region_of(country: Country | None) -> str | None:
    """The region a country sits in, or ``None`` if it is not under one.

    Countries hang off regions through a self-referential parent chain, with a
    subregion sometimes in between, so this walks up rather than reading the
    immediate parent. A region entry has no region of its own.
    """
    node = country.parent if country else None
    while node:
        if node.location_type == Country.LocationType.REGION:
            return node.name
        node = node.parent
    return None


def region_bucket(country: Country | None) -> str | None:
    """The region a project is charted under, given the entry it is against.

    ``region_of`` answers where a country sits, and a region sits under no
    region. A project can name a region entry directly, though, and it belongs
    in that region's bar rather than in none.
    """
    if country is None:
        return None
    if country.location_type == Country.LocationType.REGION:
        return country.name
    return region_of(country)


def disbursed_by_bucket(by_sector_code: dict[str, float]) -> dict[str, float]:
    """Fold per-sector-code disbursement into the six charted buckets."""
    folded: dict[str, float] = {}
    for code, amount in by_sector_code.items():
        bucket = SECTOR_BUCKET_BY_CODE.get(code)
        if bucket:
            folded[bucket] = folded.get(bucket, 0.0) + amount
    return folded


def classify(projects: Iterable[Project]) -> list[ClassifiedProject]:
    """Bucket every project once."""
    window_codes = funding_window_codes()
    classified = []

    for project in projects:
        production = is_production(project)
        detail = substance_family_detail(project)
        classified.append(
            ClassifiedProject(
                project=project,
                family=ODS if detail in (HCFC, OTHER_ODS) else detail,
                family_detail=detail,
                theme=project_theme(project, production, window_codes),
                sector_bucket=sector_bucket(project),
                is_production=production,
            )
        )
    return classified


def log_unbucketed_sectors(rows: Sequence[ClassifiedProject]) -> None:
    """Report the sectors the fund-wide chart leaves out.

    An unbucketed sector is dropped from that chart, which is a real omission -
    so it is logged for the operator. It is not disclosed in the payload, which
    is headed for a public page.
    """
    dropped: dict[str, float] = {}
    for row in rows:
        sector = row.project.sector
        if row.sector_bucket is not None or sector is None:
            continue
        name = sector.code or sector.name
        dropped[name] = dropped.get(name, 0.0) + (row.project.total_fund or 0)

    if dropped:
        logger.info(
            "Dashboard metrics: %d sectors are outside the six charted buckets "
            "and are absent from the sector figures: %s",
            len(dropped),
            {code: round(amount, 2) for code, amount in sorted(dropped.items())},
        )


def implementing_agency_ids() -> dict[int, str]:
    """``{agency_id: name}`` for the agencies that get a row of their own.

    Resolved through ``AgencyManager.find_by_name``, which is case-insensitive
    and strips, so casing drift in the table does not silently move an agency
    into the bilateral total. A name with no agency is skipped: WMO is expected
    to be missing until it has projects.
    """
    resolved = {}
    for name in IMPLEMENTING_AGENCY_NAMES:
        agency = Agency.objects.find_by_name(name)
        if agency:
            resolved[agency.id] = agency.get_name_display()
    return resolved


def agency_rollup(rows: Sequence[ClassifiedProject]) -> list[dict[str, Any]]:
    """Each implementing agency on its own row, the rest summed into one."""
    implementing = implementing_agency_ids()

    def label(row: ClassifiedProject) -> str:
        agency = row.project.agency
        if agency is None:
            return BILATERAL_LABEL
        return implementing.get(agency.id, BILATERAL_LABEL)

    table = grouped(rows, label)
    # The bilateral total is a roll-up of everything left over, so it reads last
    # however large it is.
    return sorted(table, key=lambda row: row["group"] == BILATERAL_LABEL)
