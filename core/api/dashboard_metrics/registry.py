"""
The ``Metric`` contract shared by both Our Work dashboard registries.

See ``docs/dashboard_metrics.md``.
"""

from collections.abc import Iterable
from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable

from django.core.exceptions import ImproperlyConfigured

from core.api.dashboard_metrics import taxonomy
from core.api.dashboard_metrics.primitives import entry_candidates, key_problems
from core.models.project_metadata import ProjectCluster

# Metric is a declaration, not an object with behavior.
# pylint: disable=R0902


class Kind(str, Enum):
    """The declared shape of a value. Clients must not sniff types."""

    SCALAR = "scalar"
    BREAKDOWN = "breakdown"  # dict of named components
    TABLE = "table"  # list of rows keyed by a group
    SERIES = "series"  # [[year, value], ...] ascending


class Unit(str, Enum):
    """The declared unit. Clients must not infer currency from label text."""

    USD = "USD"
    ODP_TONNES = "ODP_TONNES"
    CO2EQ_TONNES = "CO2EQ_TONNES"
    COUNT = "COUNT"
    MONTHS = "MONTHS"
    KWH_PER_YEAR = "KWH_PER_YEAR"
    PERCENT = "PERCENT"


class Disposition(str, Enum):
    """Whether a datapoint is computed, fixed, or blocked."""

    COMPUTE = "COMPUTE"
    COMPUTE_PARTIAL = "COMPUTE_PARTIAL"
    # Supplied by MLF as a fixed figure with nowhere to store it, so it is
    # written into the registry. Values that do have a home - the constance
    # config fields - are COMPUTE, because they read from a source like any
    # other metric; db_source says which.
    STATIC = "STATIC"
    NOT_AVAILABLE = "NOT_AVAILABLE"


@dataclass(frozen=True)
class Metric:
    """One addressable datapoint.

    ``compute`` is the only executable field, and ``compute=None`` surfaces as
    ``available: false``. The rest is documentation, served to no one; render
    it with ``manage.py dashboard_metrics_spec``.

    ``placeholder`` is the exception: it runs, but only for a caller who asked
    for ``?placeholders=true``, and only where ``compute`` has nothing to give.
    """

    metric_id: str
    label: str
    section: str
    kind: Kind
    unit: Unit | None
    disposition: Disposition
    formula: str
    db_source: str  # what the metric needs, e.g. "DB-COMPUTABLE", "NEEDS-APR"
    src_model_field: str
    compute: Callable[..., Any] | None
    unavailable_reason: str | None = None
    placeholder: Callable[..., Any] | None = None


def index_metrics(metrics: Iterable[Metric], registry_name: str) -> dict[str, Metric]:
    """metric_id -> Metric, rejecting duplicates at import time."""
    index: dict[str, Metric] = {}
    for metric in metrics:
        if metric.metric_id in index:
            raise ImproperlyConfigured(
                f"Duplicate metric_id {metric.metric_id!r} in {registry_name}."
            )
        index[metric.metric_id] = metric
    return index


def unmapped_cluster_codes() -> set[str]:
    """Live cluster codes with neither a theme nor a known-unmapped entry."""
    known = set(taxonomy.THEME_BY_CLUSTER_CODE) | taxonomy.KNOWN_UNMAPPED_CLUSTER_CODES
    return {
        cluster.code or f"(no code: {cluster.name})"
        for cluster in ProjectCluster.objects.filter(obsolete=False)
        if (cluster.code or "") not in known
    }


def assert_entry_keys_disjoint() -> None:
    """No two entries may claim the same URL key.

    Not called on the request path, which drops the offending entries instead.
    This is the half a person sees.
    """
    unaddressable, collisions = key_problems(entry_candidates())
    if collisions:
        raise ImproperlyConfigured(
            f"The iso3 and abbr keyspaces have collided: {collisions}. These "
            f"entries are withheld from the API."
        )
    if unaddressable:
        raise ImproperlyConfigured(
            f"Project-bearing countries with no iso3/abbr key: {unaddressable}. "
            f"They are dropped from the API."
        )


def assert_clusters_mapped() -> None:
    """Every live cluster is either themed or knowingly unthemed."""
    missing = sorted(unmapped_cluster_codes())
    if missing:
        raise ImproperlyConfigured(
            f"Clusters absent from taxonomy.THEME_BY_CLUSTER_CODE and from "
            f"KNOWN_UNMAPPED_CLUSTER_CODES: {missing}. Map them, or list them "
            f"as knowingly unmapped."
        )
