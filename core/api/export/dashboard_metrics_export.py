"""
Dashboard metrics as a workbook, for review away from the API.

One sheet for the fund and one for every country, a row per figure rather than
per metric, so that each number a reviewer might question has a line of its own
and an empty column to write in.
"""

from typing import Any, Iterator

import openpyxl

from core.api.dashboard_metrics import get_fund_metrics, iter_country_metrics
from core.api.export.base import BaseWriter, configure_sheet_print
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


class MetricsWriter(BaseWriter):
    """The declarative writer; every column is described in the headers."""

    ROW_HEIGHT = 15
    COLUMN_WIDTH = 20
    header_row_start_idx = 1


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
    if kind == "grouped_series" and isinstance(value, dict):
        return [
            (series.get("name", key), _points(series.get("values")))
            for key, series in value.items()
        ]
    if kind in SERIES_KINDS:
        return [("", _points(value))]
    return list(_leaves(value))


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
            "value": figure if figure is not None else "",
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
        self.wb = openpyxl.Workbook()

    def _sheet(self, title: str, headers: list[dict], rows: Iterator[dict]) -> None:
        sheet = self.wb.create_sheet(title)
        configure_sheet_print(sheet, "landscape")
        MetricsWriter(sheet, headers).write(list(rows))

    def export_xls(self):
        """The response, with both sheets written."""
        fund = get_fund_metrics(apr_year=self.apr_year, placeholders=self.placeholders)
        self._sheet("Fund", METRIC_HEADERS, _payload_rows(fund))

        # The trends cover the whole portfolio in one pass, so every entry
        # shares one build; see iter_country_metrics.
        self._sheet(
            "Countries",
            ENTRY_HEADERS + METRIC_HEADERS,
            (
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
            ),
        )

        # openpyxl opens with a default sheet that nothing was written to.
        del self.wb[self.wb.sheetnames[0]]
        return workbook_response("Dashboard metrics", self.wb)
