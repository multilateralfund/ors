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
from core.models.funding_window import FundingWindow
from core.models.project import Project

logger = logging.getLogger(__name__)

HFC = "HFC"
ODS = "ODS"

# The clusters that decide a project's substance family. Cluster is the primary
# signal, not a fallback: it is curated, it covers the whole portfolio, and it
# reproduces the published figures. Project.substance_type is read nowhere -
# it is deprecated and null on roughly two thirds of the projects.
HFC_CLUSTER_CODES = frozenset(
    {"HFCIND", "KIP1", "KIP2", "KIP3", "KPP1", "KPP2", "KPP3", "EC 1"}
)
ODS_CLUSTER_CODES = frozenset(
    {
        "CFCIND",
        "CPOP",
        "CPPOP",
        "HCFCIND",
        "HPMP1",
        "HPMP2",
        "HPMP3",
        "HPMP4",
        "HPPMP1",
        "HPPMP2",
        "HPPMP3",
        "OOI",
        "OOSP",
        "OOPPP",
    }
)

# Read only when the cluster says nothing. Annex F is the HFC annex; A, B, C and
# E are the ozone-depleting ones.
HFC_ANNEXES = frozenset({"F"})
ODS_ANNEXES = frozenset({"A", "B", "C", "E"})

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

# Each of these gets its own row; everything else sums into one. WMO is an
# implementer-in-waiting and is simply absent until it has projects.
IMPLEMENTING_AGENCY_NAMES = ("UNDP", "UNEP", "UNIDO", "World Bank", "WMO")
BILATERAL_LABEL = "Bilateral Agencies"


class ClassifiedProject(NamedTuple):
    """One project with the buckets it belongs to, worked out once."""

    project: Project
    family: str | None
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


def substance_family(project: Project) -> str | None:
    """``"ODS"``, ``"HFC"``, or ``None`` for a project that is neither.

    ``ODS`` covers everything with an ozone-depletion potential, HCFCs
    included - the fund-wide figures split two ways because their two headline
    numbers are in different units, ODP tonnes against CO2-eq tonnes.
    """
    code = project.cluster.code if project.cluster else None
    if code in HFC_CLUSTER_CODES:
        return HFC
    if code in ODS_CLUSTER_CODES:
        return ODS

    annexes = {
        ods.ods_substance.group.annex
        for ods in project.ods_odp.all()
        if ods.ods_substance and ods.ods_substance.group
    }
    if annexes & HFC_ANNEXES:
        return HFC
    if annexes & ODS_ANNEXES:
        return ODS
    return None


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


def disbursed_by_bucket(by_sector_code: dict[str, float]) -> dict[str, float]:
    """Fold per-sector-code disbursement into the six charted buckets."""
    folded: dict[str, float] = {}
    for code, amount in by_sector_code.items():
        bucket = SECTOR_BUCKET_BY_CODE.get(code)
        if bucket:
            folded[bucket] = folded.get(bucket, 0.0) + amount
    return folded


def classify(projects: Iterable[Project]) -> list[ClassifiedProject]:
    """Bucket every project once, and report the sectors that fall outside.

    An unbucketed sector is dropped from the sector chart, which is a real
    omission - so it is logged for the operator. It is not disclosed in the
    payload, which is headed for a public page.
    """
    classified = []
    dropped: dict[str, float] = {}
    window_codes = funding_window_codes()

    for project in projects:
        production = is_production(project)
        bucket = sector_bucket(project)
        if bucket is None and project.sector:
            dropped[project.sector.code or project.sector.name] = dropped.get(
                project.sector.code or project.sector.name, 0.0
            ) + (project.total_fund or 0)
        classified.append(
            ClassifiedProject(
                project=project,
                family=substance_family(project),
                theme=project_theme(project, production, window_codes),
                sector_bucket=bucket,
                is_production=production,
            )
        )

    if dropped:
        logger.info(
            "Dashboard metrics: %d sectors are outside the six charted buckets "
            "and are absent from the sector figures: %s",
            len(dropped),
            {code: round(amount, 2) for code, amount in sorted(dropped.items())},
        )
    return classified


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
