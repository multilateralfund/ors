"""
The data every metric shares, fetched once per request.

Metrics are handed this object to read what they need and do arithmetic
so all Metrics aren't running their own queries.

See ``docs/dashboard_metrics.md``.
"""

from dataclasses import dataclass
from decimal import Decimal
from functools import cached_property
from typing import Callable

from core.api.dashboard_metrics.apr import AprMetrics, apr_records
from core.api.dashboard_metrics.classify import (
    ClassifiedProject,
    classify,
    log_unbucketed_sectors,
)
from core.api.dashboard_metrics.cp import CountryProgrammeTrends, load_trends
from core.api.dashboard_metrics.primitives import (
    dashboard_project_rows,
    excluded_project_rows,
)
from core.api.dashboard_metrics.replenishment import pledged_total
from core.models.country import Country


@dataclass
class MetricContext:
    """Shared raw data for all the metrics in one payload to compute against.

    Each source is fetched on first use.
    """

    apr_year: int | None = None
    # Set for a per-country payload; None means the whole fund.
    country: Country | None = None

    @cached_property
    def projects(self) -> list[ClassifiedProject]:
        """The in-scope projects, each already bucketed by theme and sector."""
        rows = classify(dashboard_project_rows(self.country))
        log_unbucketed_sectors(rows)
        return rows

    @cached_property
    def excluded(self) -> list[ClassifiedProject]:
        """What the Transferred/Closed rule takes out, so it can be reported."""
        return classify(excluded_project_rows(self.country))

    @cached_property
    def cp(self) -> CountryProgrammeTrends:
        """Reported consumption and production, for the whole portfolio at once."""
        return load_trends()

    @cached_property
    def apr(self) -> AprMetrics | None:
        """The selected reporting cycle, or ``None`` when it holds nothing."""
        records = apr_records(self.apr_year, self.country)
        return AprMetrics(records) if records else None

    @cached_property
    def pledged(self) -> Decimal | None:
        """Cumulative pledged contributions."""
        return pledged_total()

    def where(
        self, predicate: Callable[[ClassifiedProject], bool]
    ) -> list[ClassifiedProject]:
        """The projects matching a rule."""
        return [row for row in self.projects if predicate(row)]

    def with_status(self, *codes: str) -> list[ClassifiedProject]:
        """The projects in any of the given statuses."""
        wanted = set(codes)
        return self.where(
            lambda row: row.project.status is not None
            and row.project.status.code in wanted
        )

    def with_family(self, family: str) -> list[ClassifiedProject]:
        """The projects addressing one substance family."""
        return self.where(lambda row: row.family == family)
