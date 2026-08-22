"""
Country-programme consumption and production trends.

A reshaping adapter, not a computation. ``CPDataExtractionAllExport``
(``core/api/views/cp_records_export.py``) instantiates with no arguments and
already does the work, unit conversions included:

- ``_get_cp_consumption_data`` - section A per (country, group), in ODP
- ``_get_hfc_consumption_data`` - annex F, converted to CO2-eq via GWP
- ``get_existent_reports`` - which (country, year) pairs actually reported,
  which is what separates a genuine zero from a missing report
- ``get_consumption_set`` / ``get_mbr_consumption_data`` - the consumption
  rules and the methyl bromide QPS split

Call it once for the whole portfolio and index by country; it computes
everything at once, so calling it per country is pathological. This module
reshapes ``record_value_<year>`` keys into ``[[year, value], ...]``, drops the
pre-seeded zero rows, and keeps genuine zero years - a country reaching zero is
the result worth showing.

Records arrive via ``get_final_records_for_years``
(``core/api/views/utils.py``). ``ods_production`` has no equivalent upstream
and is written here, returning ``None`` when every year is zero.
"""

from dataclasses import dataclass

from django.db import models

from core.api.views.cp_records_export import CPDataExtractionAllExport
from core.api.views.utils import get_final_records_for_years
from core.models.country import Country
from core.models.country_programme import CPReport
from core.models.country_programme_archive import CPReportArchive

# The year suffix carries the figure; every other key on those rows is metadata.
ODS_CONSUMPTION_PREFIX = "record_value_"
HFC_CONSUMPTION_PREFIX = "consumption_co2_"

CONSUMPTION_SECTION = "A"

# [[year, value], ...] ascending.
Series = list[list[float]]
ByYear = dict[str, dict[int, float]]


@dataclass(frozen=True)
class CountryProgrammeTrends:
    """Every country's reported series, indexed by country name.

    Country name is what the export keys on, so it is what this indexes on.
    """

    ods_consumption: ByYear
    hfc_consumption: ByYear
    ods_production: ByYear

    def consumption_odp(self, country_name: str) -> Series | None:
        """Section-A consumption in ODP tonnes, or ``None`` if data doesn't exist."""
        return _series(self.ods_consumption.get(country_name))

    def consumption_co2(self, country_name: str) -> Series | None:
        """Annex-F consumption in CO2-eq tonnes, or ``None`` if data doesn't exist."""
        return _series(self.hfc_consumption.get(country_name))

    def production_odp(self, country_name: str) -> Series | None:
        """Production in ODP tonnes time series, or ``None`` if data doesn't exist."""
        by_year = self.ods_production.get(country_name)
        if not by_year or not any(by_year.values()):
            return None
        return _series(by_year)


def load_trends() -> CountryProgrammeTrends:
    """Build the whole portfolio's trends in one pass."""
    span = _reported_years()
    if span is None:
        return CountryProgrammeTrends({}, {}, {})

    min_year, max_year = span
    export = CPDataExtractionAllExport()
    existent_reports = export.get_existent_reports(min_year, max_year)
    consumption_set = export.get_consumption_set(min_year, max_year)

    # Called, not reimplemented, so that the consumption rules and the ODP and
    # GWP conversions keep one definition. Change them there and this follows;
    # rename or re-signature them and this breaks loudly.
    # pylint: disable=W0212
    return CountryProgrammeTrends(
        ods_consumption=_totalled(
            export._get_cp_consumption_data(
                min_year, max_year, consumption_set, existent_reports
            ),
            ODS_CONSUMPTION_PREFIX,
        ),
        hfc_consumption=_totalled(
            export._get_hfc_consumption_data(
                min_year, max_year, consumption_set, existent_reports
            ),
            HFC_CONSUMPTION_PREFIX,
        ),
        ods_production=_production_by_country(min_year, max_year),
    )


def _reported_years() -> tuple[int, int] | None:
    """The span of years anything has been reported for, or ``None`` if nothing has."""
    years = []
    for model in (CPReport, CPReportArchive):
        span = model.objects.aggregate(low=models.Min("year"), high=models.Max("year"))
        years += [span["low"], span["high"]]
    reported = [year for year in years if year is not None]
    return (min(reported), max(reported)) if reported else None


def _totalled(rows: dict, prefix: str) -> ByYear:
    """Sum one export sheet's per-substance rows into a per-country series.

    The rows a country never reported are pre-seeded as zeros and contribute
    nothing. The years themselves come from ``get_existent_reports``, so a year
    is present because a report exists for it.
    """
    totals: ByYear = {}
    for (country_name, _group), values in rows.items():
        by_year = totals.setdefault(country_name, {})
        for key, value in values.items():
            year = _year_of(key, prefix)
            if year is not None:
                by_year[year] = by_year.get(year, 0.0) + float(value or 0)
    return totals


def _production_by_country(min_year: int, max_year: int) -> ByYear:
    """Production in ODP tonnes per country and year."""
    names = dict(Country.objects.values_list("id", "name"))
    records = get_final_records_for_years(
        min_year,
        max_year,
        [models.Q(section=CONSUMPTION_SECTION), models.Q(substance__isnull=False)],
        list_sort=False,
    )

    totals: ByYear = {}
    for record in records:
        report = record.country_programme_report
        country_name = names.get(report.country_id)
        if country_name is None:
            continue
        by_year = totals.setdefault(country_name, {})
        by_year[report.year] = by_year.get(report.year, 0.0) + float(
            record.mt_convert_to_odp(record.production)
        )
    return totals


def _year_of(key: str, prefix: str) -> int | None:
    """The year a ``<prefix><year>`` key names, or ``None`` for anything else."""
    if not key.startswith(prefix):
        return None
    suffix = key[len(prefix) :]
    return int(suffix) if suffix.isdigit() else None


def _series(by_year: dict[int, float] | None) -> Series | None:
    """``[[year, value], ...]`` ascending. Zero years are kept."""
    if not by_year:
        return None
    return [[year, round(value, 2)] for year, value in sorted(by_year.items())]
