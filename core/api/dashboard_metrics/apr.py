"""
APR cycle resolution and aggregations.

The aggregations are ORS's own: :class:`AprMetrics` subclasses the summary
tables export writer and replaces only its ``__init__``, so the arithmetic is
inherited rather than redefined. That constructor exists to build a workbook:
it narrows to the three statuses those sheets report on, and serializes every
record for the one sheet that renders raw rows. We want neither, and the four
aggregation helpers only ever read ``self.records`` - which this class sets
itself.

See ``docs/dashboard_metrics.md``.
"""

from typing import Sequence

from core.api.dashboard_metrics.primitives import dashboard_projects
from core.api.export.annual_project_report import APRSummaryTablesExportWriter
from core.api.utils import get_latest_endorsed_year
from core.models.annual_project_report import AnnualProgressReport, AnnualProjectReport
from core.models.country import Country
from core.models.project_metadata import ProjectStatus

INVESTMENT_TYPE_CODE = "INV"

# The APR row carries its own status, and that is the one that is current: a
# project's own status only catches up once the cycle is endorsed. It is stored
# as a display name, so the names are resolved from the codes.
ACTIVE_CYCLE_STATUS_CODES = ("ONG", "COM")

# Columns for time calculations
DATE_APPROVED = "date_approved_denorm"
DATE_FIRST_DISBURSEMENT = "date_first_disbursement"
DATE_ACTUAL_COMPLETION = "date_actual_completion"


class AprMetrics(APRSummaryTablesExportWriter):
    """The export's aggregations over a set of records we choose."""

    # The parent's constructor is replaced wholesale, arguments and all.
    # pylint: disable=W0231
    def __init__(self, records: Sequence[AnnualProjectReport]):
        self.records = list(records)

    def investment(self) -> list[AnnualProjectReport]:
        """Investment project reports."""
        return self._filter_records(type_code=INVESTMENT_TYPE_CODE)

    def non_investment(self) -> list[AnnualProjectReport]:
        """Everything that is not an investment project."""
        return self._filter_records(exclude_type_codes=(INVESTMENT_TYPE_CODE,))

    def avg_months(
        self, records: Sequence[AnnualProjectReport], start: str, end: str
    ) -> float | None:
        """Average whole months between two date columns, or ``None`` if unmeasured."""
        measurable = [
            apr
            for apr in records
            if self._get_field_value(apr, start) and self._get_field_value(apr, end)
        ]
        if not measurable:
            return None
        return round(self._calculate_avg_months(measurable, start, end), 1)

    def months_to_first_disbursement(
        self, records: Sequence[AnnualProjectReport]
    ) -> float | None:
        """Average months from approval to the first money going out."""
        return self.avg_months(records, DATE_APPROVED, DATE_FIRST_DISBURSEMENT)

    def months_to_completion(
        self, records: Sequence[AnnualProjectReport]
    ) -> float | None:
        """Average months from approval to actual completion."""
        return self.avg_months(records, DATE_APPROVED, DATE_ACTUAL_COMPLETION)

    def funds_disbursed(self) -> dict[str, float]:
        """Disbursement to date, and the part of it inside the active cycle.

        ``funds_disbursed`` is cumulative per project, so the total over the
        cycle's records is the since-inception figure.
        """
        active_names = set(
            ProjectStatus.objects.filter(
                code__in=ACTIVE_CYCLE_STATUS_CODES
            ).values_list("name", flat=True)
        )
        active = [apr for apr in self.records if apr.status in active_names]
        return {
            "all_time": round(sum(apr.funds_disbursed or 0 for apr in self.records), 2),
            "active_cycle": round(sum(apr.funds_disbursed or 0 for apr in active), 2),
        }

    def disbursed_by_sector_code(self) -> dict[str, float]:
        """``{sector code: funds disbursed}``, through the export's own grouping."""
        grouped = self._compute_grouped_data(
            self.records,
            "sector_code_denorm",
            include_odp_co2=False,
            sheet_type="cumulative",
        )
        return {code: data["total_funds_disbursed"] for code, data in grouped}


def avg_months_between(objects: Sequence[object], start: str, end: str) -> float | None:
    """Average whole months between two date fields on anything.

    The export's month arithmetic is not specific to project reports - it reads
    named fields off whatever it is handed - so the one non-APR duration on the
    page is measured with the same rule rather than a second one.
    """
    return AprMetrics([]).avg_months(objects, start, end)


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


def apr_records(
    year: int | None, country: Country | None = None
) -> list[AnnualProjectReport]:
    """Every report in one cycle, on a project this dashboard counts.

    Unfiltered by report status on purpose: a report's status describes where
    the project had got to that year, and these figures are quoted against the
    whole portfolio rather than the part of it that was moving.

    The population filter is not optional, though. Without it the disbursement
    figures would cover projects whose approved funding is excluded, and the
    two halves of "disbursed against approved" would not describe the same set.
    """
    if year is None:
        return []
    records = AnnualProjectReport.objects.filter(
        report__progress_report__year=year,
        project__in=dashboard_projects(),
    ).select_related("project__project_type", "project__status")
    if country is not None:
        records = records.filter(project__country=country)
    return list(records.order_by("id"))
