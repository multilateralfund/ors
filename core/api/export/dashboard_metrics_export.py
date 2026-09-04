"""
Dashboard metrics as a workbook, for review away from the API.

One sheet for the fund and one for every country, a row per figure rather than
per metric, so that each number a reviewer might question has a line of its own
and an empty column to write in.
"""

from typing import Any, Iterator

import openpyxl
from django.http import HttpResponse
from django.utils import timezone

from core.api.dashboard_metrics import get_fund_metrics, iter_country_metrics
from core.api.export.base import WriteOnlyBase, configure_sheet_print
from core.api.export.dashboard_metrics_page import render_page
from core.api.utils import workbook_response

SERIES_KINDS = ("series", "grouped_series")

# A component path reads "lvc / funds_approved"; a table row puts its group
# first, so "UNDP / funds_approved".
COMPONENT_SEPARATOR = " / "

METRIC_HEADERS = [
    {"id": "section", "headerName": "Section", "column_width": 34},
    {"id": "metric", "headerName": "Metric", "column_width": 30},
    {"id": "component", "headerName": "Component", "column_width": 28},
    {"id": "label", "headerName": "Label", "column_width": 42},
    {"id": "unit", "headerName": "Unit", "column_width": 14},
    {"id": "available", "headerName": "Available", "column_width": 11},
    {"id": "placeholder", "headerName": "Placeholder", "column_width": 12},
    {"id": "value", "headerName": "Value", "column_width": 46},
    {"id": "notes", "headerName": "Notes", "column_width": 40},
]

ENTRY_HEADERS = [
    {"id": "key", "headerName": "Key", "column_width": 8},
    {"id": "country", "headerName": "Country", "column_width": 28},
    {"id": "entry_type", "headerName": "Type", "column_width": 10},
]


class MetricsWriter(WriteOnlyBase):
    """The declarative writer; every column is described in the headers."""

    ROW_HEIGHT = 15
    COLUMN_WIDTH = 20
    header_row_start_idx = 1

    def write_data(self, data):
        """Append plain values instead of a styled cell object for each -
        helps with performance with many rows.
        """
        keys = [header["id"] for header in self.headers]
        for record in data:
            self.sheet.append([record.get(key, "") for key in keys])


def _points(pairs: Any) -> str:
    """``[[1995, 11.5], ...]`` as ``"1995: 11.5; 1996: 9.2"``.

    A series is chart data rather than something anyone reviews a value of, so
    it stays in one cell instead of becoming thirty rows per country.
    """
    if not isinstance(pairs, list):
        return str(pairs)
    return "; ".join(f"{point[0]}: {point[1]}" for point in pairs if len(point) == 2)


def _join(*parts: str) -> str:
    return COMPONENT_SEPARATOR.join(part for part in parts if part)


def _leaves(value: Any, prefix: str = "") -> Iterator[tuple[str, Any]]:
    """``(component, value)`` for every figure inside a metric's value.

    A breakdown yields one per named component and a table one per row and
    column, so a reviewer can object to a single number rather than to a blob.
    """
    if isinstance(value, dict):
        for key, item in value.items():
            yield from _leaves(item, _join(prefix, str(key)))
    elif value and isinstance(value, list) and isinstance(value[0], dict):
        for row in value:
            group = str(row.get("group", ""))
            for key, item in row.items():
                if key != "group":
                    yield from _leaves(item, _join(prefix, group, str(key)))
    else:
        yield prefix, value


def _figures(metric: dict[str, Any]) -> list[tuple[str, Any]]:
    """The rows one metric becomes."""
    if not metric["available"] or metric["value"] is None:
        return [("", "")]
    kind, value = metric["kind"], metric["value"]
    series_values = []
    if kind == "grouped_series" and isinstance(value, dict):
        for index, year in enumerate(value.get("years", [])):
            data = []
            for entry in value.get("series", []):
                data.append(
                    entry.get("data", [])[index]
                    if index < len(entry.get("data", []))
                    else None
                )
                series_values.append((entry.get("name", ""), {year: data}))
    if kind in SERIES_KINDS:
        return [("", _points(value))]
    return list(_leaves(value))


def _cell(value: Any) -> Any:
    """A figure as something a spreadsheet cell and a table cell can both hold.

    Numbers and strings pass through so the spreadsheet keeps them typed;
    anything else - an empty table, a nested remnant - becomes text, because a
    cell cannot hold a list.
    """
    if value is None or (isinstance(value, (list, dict, str)) and not value):
        return ""
    return value if isinstance(value, (int, float, str)) else str(value)


def _metric_rows(metric: dict[str, Any], **extra: str) -> Iterator[dict[str, Any]]:
    for component, figure in _figures(metric):
        yield {
            **extra,
            "section": metric["section"],
            "metric": metric["metric_id"],
            "label": metric["label"],
            "component": component,
            "unit": metric["unit"] or "",
            "available": "Yes" if metric["available"] else "No",
            # Only ever written onto an invented value, so the column is blank
            # wherever the figure is real.
            "placeholder": "PLACEHOLDER" if metric.get("placeholder") else "",
            "value": _cell(figure),
            "notes": "",
        }


def _payload_rows(payload: dict[str, Any], **extra: str) -> Iterator[dict[str, Any]]:
    for metric in payload["metrics"].values():
        yield from _metric_rows(metric, **extra)


class DashboardMetricsExport:
    """The workbook both dashboard pages can be reviewed from."""

    def __init__(self, apr_year: int | None = None, placeholders: bool = False):
        self.apr_year = apr_year
        self.placeholders = placeholders
        self.wb = openpyxl.Workbook(write_only=True)

    def _sheet(self, title: str, headers: list[dict], rows: Iterator[dict]) -> None:
        sheet = self.wb.create_sheet(title)
        configure_sheet_print(sheet, "landscape")
        MetricsWriter(sheet, headers).write(rows)

    def _sheets(self) -> Iterator[tuple[str, list[dict], Iterator[dict]]]:
        """``(title, headers, rows)`` for each sheet, in order.

        Both output formats read this, so the workbook and the page cannot
        disagree about a figure.
        """
        fund = get_fund_metrics(apr_year=self.apr_year, placeholders=self.placeholders)
        yield "Fund", METRIC_HEADERS, _payload_rows(fund)
        # The trends cover the whole portfolio in one pass, so every entry
        # shares one build; see iter_country_metrics.
        yield "Countries", ENTRY_HEADERS + METRIC_HEADERS, (
            row
            for payload in iter_country_metrics(
                apr_year=self.apr_year, placeholders=self.placeholders
            )
            for row in _payload_rows(
                payload,
                key=payload["entry"]["key"],
                country=payload["entry"]["name"],
                entry_type=payload["entry"]["entry_type"],
            )
        )

    def export_html(self):
        """The same figures laid out as a page, for reading without a spreadsheet."""
        fund = get_fund_metrics(apr_year=self.apr_year, placeholders=self.placeholders)
        entries = list(
            iter_country_metrics(apr_year=self.apr_year, placeholders=self.placeholders)
        )
        generated = timezone.now().strftime("%Y-%m-%d %H:%M UTC")
        return HttpResponse(
            render_page(fund, entries, generated), content_type="text/html"
        )

    def export_xls(self):
        """Both sheets as a workbook."""
        for title, headers, rows in self._sheets():
            self._sheet(title, headers, rows)
        # A write-only workbook opens with no default sheet to remove.
        return workbook_response("Dashboard metrics", self.wb)
