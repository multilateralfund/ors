"""
The project population and the country/region entries every metric is built on.

See ``docs/dashboard_metrics.md``.
"""

import logging
from collections.abc import Sequence
from typing import Any, Callable

from django.db.models import QuerySet

from core.models.country import Country
from core.models.project import Project
from core.models.project_metadata import ProjectStatus

logger = logging.getLogger(__name__)

# Transferred and Closed; what it removes is reported by scope_excluded_status
# rather than vanishing.
EXCLUDED_STATUS_CODES = ("TRF", "CLO")

# A multi-year agreement is one project spread over several tranches, so it is
# counted at a different grain from an individual project.
MYA_CATEGORY_MARKER = "multi-"


def dashboard_projects() -> QuerySet[Project]:
    """The one population every dashboard metric counts.

    Latest version only - ``Project.objects`` filters ``latest_project=None``,
    unlike ``Project.objects.really_all()``.
    """
    return Project.objects.exclude(status__code__in=EXCLUDED_STATUS_CODES)


def excluded_projects() -> QuerySet[Project]:
    """The complement, reported by the ``scope_excluded_status`` metric."""
    return Project.objects.filter(status__code__in=EXCLUDED_STATUS_CODES)


def excluded_status_labels() -> list[str]:
    """Display names for :data:`EXCLUDED_STATUS_CODES`, for the envelope."""
    return list(
        ProjectStatus.objects.filter(code__in=EXCLUDED_STATUS_CODES)
        .order_by("name")
        .values_list("name", flat=True)
    )


def dashboard_project_rows(country: Country | None = None) -> list[Project]:
    """The population as objects, in one query, ready to classify."""
    projects = dashboard_projects()
    if country is not None:
        projects = projects.filter(country=country)
    return list(
        projects.select_related(
            "agency",
            "cluster",
            "country__parent__parent",
            "funding_window__decision__meeting",
            "project_type",
            "sector",
            "status",
        )
        .prefetch_related("ods_odp__ods_substance__group")
        .order_by("id")
    )


def funds(row: Any) -> float:
    """Approved funding for one project.

    The raw field: the published figures carry no ``fund_transferred``
    adjustment, so neither does this.
    """
    return row.project.total_fund or 0.0


def funds_plus_psc(row: Any) -> float:
    """Approved funding plus programme support costs."""
    return funds(row) + (row.project.support_cost_psc or 0.0)


def funds_pair(rows: Sequence[Any]) -> dict[str, float]:
    """The two money totals that appear side by side all over both pages."""
    return {
        "funds_approved": round(sum(funds(row) for row in rows), 2),
        "funds_plus_psc": round(sum(funds_plus_psc(row) for row in rows), 2),
    }


def _is_mya(row: Any) -> bool:
    return MYA_CATEGORY_MARKER in (row.project.category or "").lower()


def _distinct(rows: Sequence[Any], attribute: str) -> int:
    """How many distinct non-empty values of ``attribute`` the rows carry.

    ``code`` and ``metacode`` are only assigned at approval, so a pre-approval
    project is null on both and must not count as a value of its own.
    """
    return len(
        {
            getattr(row.project, attribute)
            for row in rows
            if getattr(row.project, attribute)
        }
    )


def count_project_grains(rows: Sequence[Any]) -> dict[str, int]:
    """One project count per grain, because the page quotes more than one.

    A multi-year agreement is many components under one metacode; an individual
    project is one of each. The first two grains are the same numbers
    :func:`totals` reports, under the same names.
    """
    mya = [row for row in rows if _is_mya(row)]
    individual = [row for row in rows if not _is_mya(row)]
    return {
        **project_counts(rows),
        "mya_by_metacode": _distinct(mya, "metacode"),
        "individual_by_code": _distinct(individual, "code"),
    }


def project_counts(rows: Sequence[Any]) -> dict[str, int]:
    """How many projects, counted by component and by agreement."""
    return {
        "projects_by_code": _distinct(rows, "code"),
        "projects_by_metacode": _distinct(rows, "metacode"),
    }


def totals(rows: Sequence[Any]) -> dict[str, Any]:
    """What a slice of the portfolio amounts to: counts at both grains, and money."""
    return {**project_counts(rows), **funds_pair(rows)}


def grouped_row(group: str, rows: Sequence[Any]) -> dict[str, Any]:
    """One row of a by-group table."""
    return {"group": group, **totals(rows)}


def grouped(rows: Sequence[Any], key: Callable[[Any], Any]) -> list[dict[str, Any]]:
    """Split the rows by ``key`` and total each group, largest group first.

    Rows the key cannot place are dropped: a group with no name has nothing to
    render against.
    """
    buckets: dict[str, list[Any]] = {}
    for row in rows:
        group = key(row)
        if group:
            buckets.setdefault(str(group), []).append(row)
    table = [grouped_row(group, members) for group, members in buckets.items()]
    return sorted(table, key=lambda entry: -entry["projects_by_code"])


def entry_countries() -> QuerySet[Country]:
    """``Country`` rows carrying at least one in-scope project.

    Countries and the aggregate ``Region`` rows share this table, discriminated
    by ``location_type``.
    """
    return Country.objects.filter(
        id__in=dashboard_projects().values("country_id")
    ).order_by("location_type", "name")


def entry_key(country: Country) -> str | None:
    """The URL key for one entry: ``iso3`` for countries, ``abbr`` for regions."""
    if country.location_type == Country.LocationType.COUNTRY:
        return country.iso3
    return country.abbr


def entry_for(country: Country) -> dict[str, Any]:
    """The entry object embedded in a country payload and in the index."""
    is_country = country.location_type == Country.LocationType.COUNTRY
    return {
        "key": entry_key(country),
        "name": country.name,
        "entry_type": "country" if is_country else "region",
        "iso3": country.iso3 if is_country else None,
    }


def entry_candidates() -> list[dict[str, Any]]:
    """Every entry row, before addressability filtering."""
    return [entry_for(country) for country in entry_countries()]


def key_problems(
    candidates: Sequence[dict[str, Any]],
) -> tuple[list[str], dict[str, list[str]]]:
    """``(unaddressable_names, {key: claimant_names})``.

    The iso3 and abbr keyspaces are disjoint by luck, not by structure: the
    ``Caribbean`` subregion already carries ``abbr='LCA'``, Saint Lucia's
    ``iso3``, and two dormant regions join the keyspace as soon as a project
    lands on them.
    """
    unaddressable = []
    claimants: dict[str, list[str]] = {}
    for entry in candidates:
        key = (entry["key"] or "").upper()
        if not key:
            unaddressable.append(entry["name"])
            continue
        claimants.setdefault(key, []).append(entry["name"])
    collisions = {key: names for key, names in claimants.items() if len(names) > 1}
    return sorted(unaddressable), collisions


def dashboard_entries() -> list[dict[str, Any]]:
    """Every entry this API can address unambiguously.

    Bad data costs one entry, not the endpoint. An entry with no key is
    dropped; a key claimed twice is served for neither side, since picking one
    would publish its figures under the other's name. Both are logged rather
    than disclosed - the payload is headed for a public page.
    """
    candidates = entry_candidates()
    unaddressable, collisions = key_problems(candidates)

    if unaddressable:
        logger.warning(
            "Dashboard metrics: %d project-bearing countries have no iso3/abbr "
            "and are not addressable: %s",
            len(unaddressable),
            unaddressable,
        )
    if collisions:
        logger.error(
            "Dashboard metrics: the iso3 and abbr keyspaces have collided and "
            "these entries are being withheld: %s",
            collisions,
        )

    return [
        entry
        for entry in candidates
        if entry["key"] and entry["key"].upper() not in collisions
    ]


def resolve_entry(key: str) -> dict[str, Any] | None:
    """Look up one addressable entry by its URL key, case-insensitively."""
    wanted = (key or "").strip().upper()
    if not wanted:
        return None
    for entry in dashboard_entries():
        if entry["key"].upper() == wanted:
            return entry
    return None
