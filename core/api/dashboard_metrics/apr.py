"""
APR cycle resolution and aggregations.
"""

from core.api.utils import get_latest_endorsed_year
from core.models.annual_project_report import AnnualProgressReport


def apr_years_available() -> list[int]:
    """Every APR year on record, ascending - the ``?apr_year=`` domain."""
    return list(
        AnnualProgressReport.objects.order_by("year")
        .values_list("year", flat=True)
        .distinct()
    )


def resolve_apr_year(requested: int | None = None) -> int | None:
    """The reporting cycle this payload describes.

    ``?apr_year=`` wins, else the newest endorsed cycle, else the newest cycle
    with data. ``None`` means no APR data at all.
    """
    if requested is not None:
        return requested
    endorsed = get_latest_endorsed_year()
    if endorsed is not None:
        return endorsed
    years = apr_years_available()
    return years[-1] if years else None
