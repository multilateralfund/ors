"""
The project population and the country/region entries every metric is built on.

See ``docs/dashboard_metrics.md``.
"""

import logging
from collections.abc import Sequence
from typing import Any

from django.db.models import QuerySet

from core.models.country import Country
from core.models.project import Project
from core.models.project_metadata import ProjectStatus

logger = logging.getLogger(__name__)

# Transferred and Closed; what it removes is reported by scope_excluded_status
# rather than vanishing.
EXCLUDED_STATUS_CODES = ("TRF", "CLO")


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
