# pylint: disable=W0212,R0914

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

from typing import Any

# The year suffix carries the figure; every other key on those rows is metadata.
ODS_CONSUMPTION_PREFIX = "record_value_"
HFC_CONSUMPTION_PREFIX = "consumption_co2_"

CONSUMPTION_SECTION = "A"

# The Protocol's controlled groups, in the order the page indexes them.
ANNEX_GROUPS = (
    ("AI", "annex_a_group_1", "Annex A Group I"),
    ("AII", "annex_a_group_2", "Annex A Group II"),
    ("BI", "annex_b_group_1", "Annex B Group I"),
    ("BII", "annex_b_group_2", "Annex B Group II"),
    ("BIII", "annex_b_group_3", "Annex B Group III"),
    ("CI", "annex_c_group_1", "Annex C Group I"),
    ("CII", "annex_c_group_2", "Annex C Group II"),
    ("CIII", "annex_c_group_3", "Annex C Group III"),
    ("EI", "annex_e", "Annex E"),
)

# Anything reported under a group outside the nine - the uncontrolled and
# legacy groups. Served only where it holds something.
OTHER_GROUP_KEY = "other"
OTHER_GROUP_NAME = "Other substances"

GROUP_KEY_BY_ID = {group_id: key for group_id, key, _name in ANNEX_GROUPS}

# [[year, value], ...] ascending.
Series = list[list[float]]
ByYear = dict[str, dict[int, float]]
# country -> group key -> year -> value
ByGroup = dict[str, dict[str, dict[int, float]]]
# group key -> {"name": ..., "values": [[year, value], ...]}
GroupedSeries = dict[str, dict]


@dataclass(frozen=True)
class CountryProgrammeTrends:
    """Every country's reported series, indexed by country name.

    Country name is what the export keys on, so it is what this indexes on.
    """

    ods_consumption: ByGroup
    hfc_consumption: ByYear
    ods_production: ByGroup

    def consumption_odp_by_group(self, country_name: str) -> GroupedSeries | None:
        """Section-A consumption in ODP tonnes, split by Protocol group."""
        result = _prepare_line_chart_trend(
            _grouped_series(self.ods_consumption.get(country_name)),
            "ODS Consumption",
            "Chart subtitle",
        )
        return result

    def consumption_co2(self, country_name: str) -> Series | None:
        """Annex-F consumption in CO2-eq tonnes, or ``None`` if data doesn't exist."""
        return _series(self.hfc_consumption.get(country_name))

    def production_odp_by_group(self, country_name: str) -> GroupedSeries | None:
        """Production ODP tonnes time series, split by Protocol group."""
        by_group = self.ods_production.get(country_name)
        produced = any(
            value for series in (by_group or {}).values() for value in series.values()
        )
        return _grouped_series(by_group) if produced else None


def load_trends() -> CountryProgrammeTrends:
    """Build the whole portfolio's trends in one pass."""
    span = _reported_years()
    if span is None:
        return CountryProgrammeTrends({}, {}, {})

    min_year, max_year = span
    export = CPDataExtractionAllExport()
    existent_reports = export.get_existent_reports(min_year, max_year)
    consumption_set = export.get_consumption_set(min_year, max_year, list_sort=False)

    # Called, not reimplemented, so that the consumption rules and the ODP and
    # GWP conversions keep one definition. Change them there and this follows;
    # rename or re-signature them and this breaks loudly.
    return CountryProgrammeTrends(
        ods_consumption=_consumption_by_group(
            min_year, max_year, consumption_set, existent_reports
        ),
        hfc_consumption=_totalled(
            export._get_hfc_consumption_data(
                min_year, max_year, consumption_set, existent_reports, list_sort=False
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


def _group_key(record) -> str | None:
    """Which series a record belongs in, or ``None`` if it belongs in none."""
    group = record.substance.group if record.substance else None
    if group is None:
        return None
    return GROUP_KEY_BY_ID.get(group.group_id, OTHER_GROUP_KEY)


def _seed_reported_years(totals: ByGroup, existent_reports: dict) -> None:
    """Init a series for every group the country's full set of reported years."""
    for country_name, years in existent_reports.items():
        by_group = totals.setdefault(country_name, {})
        for _group_id, key, _name in ANNEX_GROUPS:
            series = by_group.setdefault(key, {})
            for year in years:
                series.setdefault(year, 0.0)


def _consumption_by_group(
    min_year: int, max_year: int, consumption_set: set, existent_reports: dict
) -> ByGroup:
    """Section-A consumption in ODP tonnes, per country, group and year."""
    names = dict(Country.objects.values_list("id", "name"))
    records = get_final_records_for_years(
        min_year,
        max_year,
        [models.Q(substance__isnull=False), models.Q(section=CONSUMPTION_SECTION)],
        list_sort=False,
    )

    totals: ByGroup = {}

    names_get = names.get
    cons_contains = consumption_set.__contains__
    group_key_fn = _group_key
    totals_setdefault = totals.setdefault

    for record in records:
        sub = getattr(record, "substance", None)
        if sub is None:
            continue

        key = group_key_fn(record)
        if key is None:
            continue

        report = record.country_programme_report
        country_name = names_get(report.country_id)
        if country_name is None:
            continue

        using_consumption_value = cons_contains(
            (country_name, report.year, record.section)
        )

        consumption_val = record.get_consumption_value(using_consumption_value) or 0.0
        odp_val = getattr(sub, "odp", 0) or 0

        value = float(consumption_val) * float(odp_val)
        country_dict = totals_setdefault(country_name, {})
        series = country_dict.setdefault(key, {})
        series[report.year] = series.get(report.year, 0.0) + value

    _seed_reported_years(totals, existent_reports)
    return totals


def _production_by_country(min_year: int, max_year: int) -> ByGroup:
    """Production in ODP tonnes per country, group and year."""
    names = dict(Country.objects.values_list("id", "name"))
    records = get_final_records_for_years(
        min_year,
        max_year,
        [models.Q(section=CONSUMPTION_SECTION), models.Q(substance__isnull=False)],
        list_sort=False,
    )

    totals: ByGroup = {}
    for record in records:
        key = _group_key(record)
        report = record.country_programme_report
        country_name = names.get(report.country_id)
        if key is None or country_name is None:
            continue
        series = totals.setdefault(country_name, {}).setdefault(key, {})
        series[report.year] = series.get(report.year, 0.0) + float(
            record.mt_convert_to_odp(record.production)
        )
    return totals


def _year_of(key: str, prefix: str) -> int | None:
    """The year a ``<prefix><year>`` key names, or ``None`` for anything else."""
    if not key.startswith(prefix):
        return None
    suffix = key[len(prefix) :]
    return int(suffix) if suffix.isdigit() else None


def _grouped_series(
    by_group: dict[str, dict[int, float]] | None,
) -> GroupedSeries | None:
    """``{group key: {"name": ..., "values": [[year, value], ...]}}``.

    Every one of the nine groups is present whether or not the country reported
    it, so the chart's series are the same set between countries. The residual
    is served only where it holds something.
    """
    if not by_group:
        return None
    years = sorted({year for series in by_group.values() for year in series})
    grouped = {
        "years": years,
    }
    grouped["values"] = [
        {
            "name": name,
            "values": [
                round(by_group.get(key, {}).get(year, 0.0), 2) for year in years
            ],
        }
        for _group_id, key, name in ANNEX_GROUPS
    ]

    residual = by_group.get(OTHER_GROUP_KEY)
    if residual:
        grouped["values"].append(
            {
                "name": OTHER_GROUP_NAME,
                "values": [round(residual.get(year, 0.0), 2) for year in years],
            }
        )
    return grouped


def _prepare_line_chart_trend(
    grouped_series: GroupedSeries, title: str, subtitle: str
) -> dict[str, Any]:
    """Prepare the grouped series data for line chart visualization."""

    if grouped_series is None:
        return {
            "type": "line",
            "title": title,
            "subtitle": subtitle,
            "categories": [],
            "series": [],
        }

    colors = [
        "var(--deep-teal)",
        "var(--purple)",
        "var(--purple-mid)",
        "var(--purple-tint)",
    ]

    return {
        "type": "line",
        "title": title,
        "subtitle": subtitle,
        "categories": grouped_series["years"],
        "series": [
            {
                "name": series["name"],
                "color": colors[i % len(colors)],
                "data": series["values"],
            }
            for i, series in enumerate(grouped_series["values"])
        ],
    }


def _series(by_year: dict[int, float] | None) -> Series | None:
    """``[[year, value], ...]`` ascending. Zero years are kept."""
    if not by_year:
        return None
    return [[year, round(value, 2)] for year, value in sorted(by_year.items())]
