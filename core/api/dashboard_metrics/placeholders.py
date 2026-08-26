"""
Stand-in values for the datapoints whose real source does not exist yet.

None of this reaches a payload unless the caller asked for it with
``?placeholders=true``, and everything that does is flagged on the wire. It
exists so a page can be built and demonstrated before the data behind it
arrives; it is not a measurement and must not be published as one.

Magnitudes are sized off the rates ``core/api/export/projects_dashboard_dump.py``
uses to mock the same underlying columns - 50 technicians and 10 customs
officers per $1M of funding - applied to a mid-sized country programme. The
rates are borrowed, the machinery is not: that module draws with numpy off the
global RNG, which is neither reproducible per entry nor safe to share.
"""

import random
from typing import Any, Callable

from core.api.dashboard_metrics.context import MetricContext
from core.api.dashboard_metrics.primitives import is_country_entry

YES_NO = ("Yes", "No")
MEPS_LABELS = ("Established", "Not established")

# Obviously invented, so nobody mistakes one for a real ozone officer.
NOU_NAMES = (
    "Mr John Smith",
    "Ms Jane Doe",
)

# The share of its baseline a stand-in row reports as phased out.
BASELINE_SHARE = (35.0, 80.0)


def rng(context: MetricContext, slug: str) -> random.Random:
    """A generator giving one entry the same answer on every request.

    Seeded per entry and per fact, never off the global RNG. A page whose
    figures reshuffled between loads would be worse than a blank one, and two
    metrics that are the same fact seed on the same slug so they cannot
    disagree.
    """
    return random.Random(f"{context.seed_key}:{slug}")


def _country(context: MetricContext) -> Any:
    """The country this payload describes, or ``None`` for an aggregate entry."""
    entry = context.country
    return entry if entry is not None and is_country_entry(entry) else None


def choice(context: MetricContext, slug: str, labels: tuple[str, str]) -> str | None:
    """A stand-in for a country attribute.

    ``None`` on the aggregate entries, exactly as the real attributes are: a
    region has no licensing system or ozone officer of its own.
    """
    if _country(context) is None:
        return None
    return rng(context, slug).choice(labels)


def nou_name(context: MetricContext) -> str | None:
    """A stand-in contact person for the national ozone unit."""
    if _country(context) is None:
        return None
    return rng(context, "nou_name").choice(NOU_NAMES)


def count(
    context: MetricContext, slug: str, low: int, high: int, step: int = 1
) -> int | None:
    """A stand-in for an impact count.

    Served for the aggregate entries too: people trained across a region is a
    figure the page can meaningfully show, unlike a region's licensing system.
    """
    if context.country is None:
        return None
    return rng(context, slug).randrange(low, high, step)


def fill_baseline(
    context: MetricContext, rows: Callable[[], list[dict[str, Any]]]
) -> list[dict[str, Any]]:
    """The baseline table with its missing denominators invented.

    ``rows`` is the real table, passed in rather than imported so the
    dependency runs one way. Only the rows it could not work out are filled, so
    the real Other ODS row passes through untouched and carries no flag.
    """
    generator = rng(context, "baseline")
    return [
        (
            row
            if row["value"] is not None
            else {
                **row,
                "value": round(generator.uniform(*BASELINE_SHARE), 1),
                "placeholder": True,
            }
        )
        for row in rows()
    ]
