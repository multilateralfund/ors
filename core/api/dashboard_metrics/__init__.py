"""
Dashboard Metrics - the fund-wide "Our Work" figures and the per-country profile figures.

See ``docs/dashboard_metrics.md``.
"""

from collections.abc import Sequence
from typing import Any

from django.utils import timezone

from core.api.dashboard_metrics.apr import apr_years_available, resolve_apr_year
from core.api.dashboard_metrics.country import COUNTRY_METRICS, COUNTRY_METRICS_BY_ID
from core.api.dashboard_metrics.fund import FUND_METRICS, FUND_METRICS_BY_ID
from core.api.dashboard_metrics.primitives import (
    dashboard_entries,
    excluded_status_labels,
    resolve_entry,
)
from core.api.dashboard_metrics.registry import Metric


def get_metric(metric_id: str) -> Metric | None:
    """Look up one declaration by id, across both registries.

    Ids are unique across the two, so which one holds it does not matter.
    """
    return FUND_METRICS_BY_ID.get(metric_id) or COUNTRY_METRICS_BY_ID.get(metric_id)


def _render(metric: Metric) -> dict[str, Any]:
    """Render one metric as the client should see it."""
    return {
        "metric_id": metric.metric_id,
        "label": metric.label,
        "section": metric.section,
        "kind": metric.kind.value,
        "unit": metric.unit.value if metric.unit else None,
        # No metrics implemented yet
        "available": False,
        "value": None,
    }


def _scope() -> dict[str, Any]:
    """What every figure below counts."""
    return {
        "population": "latest",
        "excluded_statuses": excluded_status_labels(),
        "production_included": True,
    }


def _envelope(metrics: Sequence[Metric], apr_year: int | None) -> dict[str, Any]:
    """The payload wrapper.

    There is no scope parameter: an APR-derived metric carries both the
    selected cycle and the since-inception total in its value.
    """
    return {
        "as_of": timezone.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "apr_year": apr_year,
        "apr_years_available": apr_years_available(),
        "scope": _scope(),
        "metrics": [_render(metric) for metric in metrics],
    }


def get_fund_metrics(apr_year: int | None = None) -> dict[str, Any]:
    """The fund-wide payload. Identical for every authenticated caller."""
    return _envelope(FUND_METRICS, resolve_apr_year(apr_year))


def get_country_index() -> dict[str, Any]:
    """Every addressable entry: 149 countries by iso3, 5 regions by abbr."""
    return {"entries": dashboard_entries()}


def get_country_metrics(key: str, apr_year: int | None = None) -> dict[str, Any] | None:
    """One entry's payload, or ``None`` if the key addresses nothing."""
    entry = resolve_entry(key)
    if entry is None:
        return None
    payload = _envelope(COUNTRY_METRICS, resolve_apr_year(apr_year))
    payload["entry"] = entry
    return payload
