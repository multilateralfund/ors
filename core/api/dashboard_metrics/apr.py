"""
APR cycle resolution and aggregations.

The aggregations are ORS's own: :class:`AprMetrics` subclasses the summary
tables export writer and replaces its ``__init__``, so the arithmetic is
inherited rather than redefined. That constructor exists to build a workbook:
it narrows to the three statuses those sheets report on, and serializes every
record for the one sheet that renders raw rows. We want neither, and the four
aggregation helpers only ever read ``self.records`` - which this class sets
itself.

The one figure the dashboard reads differently is disbursement: it counts the
support cost disbursed as well, to match approved funding, which is quoted
with PSC. The export keeps its own definition.

See ``docs/dashboard_metrics.md``.
"""

from functools import cached_property
from typing import Any, Callable, Iterable, Sequence

from django.db.models import F

from core.api.dashboard_metrics import classify
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

# The page shows two phase-out figures side by side, and they are different
# measurements rather than two views of one. What a project was approved to
# remove is set at approval and lives on Project; what an agency reported
# removing is per reporting cycle and lives here. Consumption and production
# count towards both.
ODP_PHASED_OUT_FIELDS = ("consumption_phased_out_odp", "production_phased_out_odp")
CO2_PHASED_OUT_FIELDS = ("consumption_phased_out_co2", "production_phased_out_co2")


def paid_out(apr: AnnualProjectReport) -> float:
    """Funds disbursed plus the support cost disbursed alongside them."""
    return (apr.funds_disbursed or 0) + (apr.support_cost_disbursed or 0)


class AprMetrics(APRSummaryTablesExportWriter):
    """The export's aggregations over a set of records we choose."""

    # The parent's constructor is replaced wholesale, arguments and all.
    # pylint: disable=W0231
    def __init__(
        self,
        records: Sequence[AnnualProjectReport],
        cycle_year: int | None = None,
    ):
        self.records = list(records)
        # Set when the records span several cycles (see
        # :func:`latest_apr_records`): only the selected cycle's own rows can
        # be inside the active cycle, whatever status an older row was left in.
        self.cycle_year = cycle_year

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

    @cached_property
    def _active_status_names(self) -> set[str]:
        """The statuses that count as inside the active cycle, by display name."""
        return set(
            ProjectStatus.objects.filter(
                code__in=ACTIVE_CYCLE_STATUS_CODES
            ).values_list("name", flat=True)
        )

    def _disbursed(self, records: Sequence[AnnualProjectReport]) -> dict[str, float]:
        """The two disbursement figures over one set of records."""
        active = [
            apr
            for apr in records
            if apr.status in self._active_status_names
            and (
                self.cycle_year is None
                or getattr(apr, "cycle_year", None) == self.cycle_year
            )
        ]
        return {
            "all_time": round(sum(paid_out(apr) for apr in records), 2),
            "active_cycle": round(sum(paid_out(apr) for apr in active), 2),
        }

    def _compute_group_data(self, records, include_odp_co2, sheet_type):
        """The export's per-group figures, with disbursement including PSC."""
        data = super()._compute_group_data(records, include_odp_co2, sheet_type)
        data["total_funds_disbursed"] = sum(paid_out(apr) for apr in records)
        return data

    def funds_disbursed(self) -> dict[str, float]:
        """Disbursement to date, and the part of it inside the active cycle.

        ``funds_disbursed`` and ``support_cost_disbursed`` are cumulative per
        project, so the total over the cycle's records is the since-inception
        figure.
        """
        return self._disbursed(self.records)

    def disbursed_grouped(
        self, key: Callable[[AnnualProjectReport], Any]
    ) -> dict[Any, dict[str, float]]:
        """The same two figures, split by whatever ``key`` says a record is.

        The caller supplies the grouping, so this stays arithmetic and knows
        nothing about what it is being grouped by. Groups the key does not
        produce are absent; a caller wanting a fixed set of components fills
        them in.
        """
        buckets: dict[Any, list[AnnualProjectReport]] = {}
        for apr in self.records:
            buckets.setdefault(key(apr), []).append(apr)
        return {group: self._disbursed(records) for group, records in buckets.items()}

    def phased_out(self, fields: Sequence[str]) -> float:
        """Phase-out reported over the cycle, summed across the named columns."""
        return round(
            sum(getattr(apr, field) or 0 for apr in self.records for field in fields), 2
        )

    def subset(self, project_ids: Iterable[int]) -> "AprMetrics":
        """The reports on the given projects, filtered in memory.

        Shares this cycle's status lookup rather than querying it again.
        """
        wanted = set(project_ids)
        subset = AprMetrics(
            [apr for apr in self.records if apr.project_id in wanted],
            cycle_year=self.cycle_year,
        )
        # Prefill the cached_property: the statuses are the same for any subset.
        subset.__dict__["_active_status_names"] = self._active_status_names
        return subset

    def disbursed_by_sector_code(self) -> dict[str, float]:
        """``{sector code: funds disbursed}``, through the export's own grouping."""
        return self._disbursed_by_sector_code

    @cached_property
    def _disbursed_by_sector_code(self) -> dict[str, float]:
        """Computed once: every sector metric reads the same grouping."""
        grouped = self._compute_grouped_data(
            self.records,
            "sector_code_denorm",
            include_odp_co2=False,
            sheet_type="cumulative",
        )
        return {code: data["total_funds_disbursed"] for code, data in grouped}

    def disbursed_by_region(self) -> dict[str, float]:
        """``{'region': funds disbursed}``, through the export's own grouping."""
        grouped = self._compute_grouped_data(
            self.records,
            "main_region",
            include_odp_co2=False,
            sheet_type="cumulative",
        )
        # Folded the way the funding side is (Europe into Europe and Central
        # Asia, West Asia into Asia and the Pacific), so the two meet per row.
        result: dict[str, float] = {}
        for region, data in grouped:
            name = classify.region_bucket(region) or region.name
            result[name] = result.get(name, 0.0) + data["total_funds_disbursed"]
        return result

    def disbursed_by_theme(self) -> dict[str, float]:
        grouped = self._compute_grouped_data(
            self.records,
            "main_region",
            include_odp_co2=False,
            sheet_type="cumulative",
        )
        return {code.name: data["total_funds_disbursed"] for code, data in grouped}


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


def _apr_queryset(country: Country | None):
    """Reports on the projects this dashboard counts, with what metrics read."""
    records = AnnualProjectReport.objects.filter(
        project__in=dashboard_projects(),
    ).select_related(
        "project__project_type",
        "project__status",
        "project__country",
        "project__country__parent",
        "project__country__parent__parent",
        "main_region",
    )
    if country is not None:
        records = records.filter(project__country=country)
    return records


def latest_apr_records(
    year: int | None, country: Country | None
) -> list[AnnualProjectReport]:
    """Each project's most recent report up to and including ``year``.

    The source for disbursement. ``funds_disbursed`` and
    ``support_cost_disbursed`` are cumulative per project, so a project's latest
    report carries everything paid out on it to date. One cycle alone is not
    enough: a project that was financially completed before it is no longer
    reported, and its disbursement would drop out of the totals.

    Each record carries ``cycle_year``, the cycle it was reported in.
    """
    if year is None:
        return []
    records = (
        _apr_queryset(country)
        .filter(report__progress_report__year__lte=year)
        .annotate(cycle_year=F("report__progress_report__year"))
        .order_by("project_id", "-report__progress_report__year", "-id")
        .distinct("project_id")
    )
    return sorted(records, key=lambda apr: apr.id)


def apr_records(
    year: int | None, country: Country | None, project_ids: list | None = None
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
    records = _apr_queryset(country).filter(report__progress_report__year=year)
    if project_ids:
        records = records.filter(project_id__in=project_ids)
    return list(records.order_by("id"))
