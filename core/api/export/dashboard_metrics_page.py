"""
The dashboard figures as one page: a tab for the fund, a tab for each country.

The fund tab is rendered server-side. The countries are embedded as data and
laid out with js in the browser when one is chosen
"""

import json
from typing import Any

from django.utils.html import escape

from core.api.dashboard_metrics import get_metric

MONEY_UNITS = ("USD",)
TONNE_UNITS = ("ODP_TONNES", "CO2EQ_TONNES")


def _number(value: Any, places: int = 2) -> str:
    """A figure with thousands separators, and no trailing zeros on a whole one."""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return escape(str(value))
    if number == int(number):
        return f"{int(number):,}"
    return f"{number:,.{places}f}"


def _scalar(value: Any, unit: str | None) -> str:
    """One figure, in the unit it was declared with."""
    if value is None or value == "":
        return '<span class="none">not available</span>'
    if isinstance(value, str):
        return escape(value)
    if unit in MONEY_UNITS:
        return f"${_number(value)}"
    if unit == "PERCENT":
        return f"{_number(value, 1)}%"
    if unit in TONNE_UNITS:
        return _number(value)
    return _number(value)


def _rows_table(rows: list[tuple[str, str]]) -> str:
    """The small two-column table a compound figure is shown as."""
    body = "".join(
        f"<tr><td>{escape(str(name))}</td><td>{value}</td></tr>" for name, value in rows
    )
    return f'<table class="sub">{body}</table>'


def _breakdown(value: dict, unit: str | None) -> str:
    return _rows_table(
        [(key.replace("_", " "), _compound(item, unit)) for key, item in value.items()]
    )


def _table(value: list, unit: str | None) -> str:
    """A group table: one line per row, its columns beneath the group name."""
    blocks = []
    for row in value:
        group = str(row.get("group", ""))
        columns = [
            (key.replace("_", " "), _scalar(item, unit))
            for key, item in row.items()
            if key != "group"
        ]
        blocks.append(
            f'<div class="grp"><b>{escape(group)}</b>{_rows_table(columns)}</div>'
        )
    return "".join(blocks)


def _series(value: list) -> str:
    """A year series, folded away - it is a chart, not a figure to check."""
    points = [f"{year}: {_number(amount)}" for year, amount in value]
    return (
        f"<details><summary>{len(points)} years</summary>"
        f'<div class="series">{escape("; ".join(points))}</div></details>'
    )


def _grouped_series(value: dict) -> str:
    parts = []
    for series in value.get("series", []):
        points = series.get("data") or []
        if not any(points):
            continue
        parts.append(
            f'<div class="grp"><b>{escape(str(series.get("name", "")))}</b>'
            f"{_series(points)}</div>"
        )
    return "".join(parts) or '<span class="none">nothing reported</span>'


def _compound(value: Any, unit: str | None) -> str:
    """A figure that may itself be a set of figures."""
    if isinstance(value, dict):
        return _breakdown(value, unit)
    return _scalar(value, unit)


def metric_html(metric: dict[str, Any]) -> str:
    """One metric's value, laid out for its declared kind."""
    if not metric["available"] or metric["value"] is None:
        return '<span class="none">not available</span>'
    kind, value, unit = metric["kind"], metric["value"], metric["unit"]
    if kind == "breakdown" and isinstance(value, dict):
        return _breakdown(value, unit)
    if kind == "table" and isinstance(value, list):
        return _table(value, unit)
    if kind == "grouped_series" and isinstance(value, dict):
        return _grouped_series(value)
    if kind == "series" and isinstance(value, list):
        return _series(value)
    return _compound(value, unit)


def _provenance(metric_id: str) -> str:
    """Where a figure comes from, read from the registry rather than the payload."""
    declared = get_metric(metric_id)
    if declared is None:
        return ""
    return (
        f'<div class="prov"><span class="tag">{escape(metric_id)}</span>'
        f'<span class="disp">{escape(declared.disposition.value)}</span>'
        f'<span class="formula">{escape(declared.formula)}</span></div>'
    )


def sections(payload: dict[str, Any]) -> list[tuple[str, list[dict]]]:
    """The payload's metrics grouped under their section, in declared order."""
    grouped: dict[str, list[dict]] = {}
    for metric_id, metric in payload["metrics"].items():
        grouped.setdefault(metric["section"], []).append(
            {
                "label": metric["label"],
                "value": metric_html(metric),
                "placeholder": bool(metric.get("placeholder")),
                "metric_id": metric_id,
            }
        )
    return list(grouped.items())


def _section_html(title: str, metrics: list[dict]) -> str:
    rows = []
    for metric in metrics:
        flag = '<span class="ph">placeholder</span>' if metric["placeholder"] else ""
        css = ' class="ph-row"' if metric["placeholder"] else ""
        rows.append(
            f"<tr{css}><td class=\"metric\">{escape(metric['label'])}{flag}"
            f"{_provenance(metric['metric_id'])}</td>"
            f"<td class=\"val\">{metric['value']}</td></tr>"
        )
    return f"<h2>{escape(title)}</h2><table>{''.join(rows)}</table>"


def _payload_html(payload: dict[str, Any]) -> str:
    return "".join(_section_html(title, rows) for title, rows in sections(payload))


_PAGE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Multilateral Fund - dashboard metrics</title>
<style>
 :root {{ --ink:#1f2328; --muted:#57606a; --line:#d0d7de; --bg:#fff; --soft:#f6f8fa; }}
 * {{ box-sizing: border-box; }}
 body {{ margin:0; padding:0 0 4rem; color:var(--ink); background:var(--bg);
   font:15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }}
 .wrap {{ max-width: 980px; margin: 0 auto; padding: 0 1.25rem; }}
 header {{ border-bottom:1px solid var(--line); background:var(--bg); padding-top:2rem; }}
 h1 {{ font-size:1.6rem; margin:0 0 .25rem; }}
 .meta {{ color:var(--muted); font-size:.9rem; margin-bottom:1rem; }}
 .tabs {{ display:flex; gap:.25rem; margin-bottom:-1px; }}
 .tabs button {{ font:inherit; font-size:.95rem; padding:.5rem 1.1rem; cursor:pointer;
   background:var(--soft); color:var(--muted); border:1px solid var(--line);
   border-bottom-color:var(--line); border-radius:8px 8px 0 0; }}
 .tabs button[aria-selected="true"] {{ background:var(--bg); color:var(--ink);
   font-weight:600; border-bottom-color:var(--bg); }}
 .picker {{ margin:1.5rem 0 .5rem; }}
 select {{ font:inherit; padding:.4rem .5rem; border:1px solid var(--line); border-radius:6px;
   min-width:18rem; }}
 h2 {{ font-size:1.15rem; margin:2.2rem 0 .6rem; padding-bottom:.3rem;
   border-bottom:2px solid var(--line); }}
 table {{ width:100%; border-collapse:collapse; margin:.25rem 0 1rem; }}
 td {{ text-align:left; padding:.45rem .6rem; border-bottom:1px solid var(--line);
   vertical-align:top; }}
 td.metric {{ max-width:26rem; }}
 td.val {{ font-variant-numeric:tabular-nums; font-weight:600; }}
 table.sub {{ margin:.1rem 0; width:auto; min-width:55%; }}
 table.sub td {{ padding:.2rem .5rem; font-size:.85rem; font-weight:400;
   border-bottom:1px dotted var(--line); }}
 .grp {{ margin:.35rem 0; }}
 .grp b {{ font-size:.85rem; color:var(--muted); }}
 .none {{ color:var(--muted); font-weight:400; font-style:italic; }}
 .ph {{ display:inline-block; background:#d4a72c; color:#fff; font-weight:700;
   font-size:.66rem; letter-spacing:.04em; padding:.02rem .35rem; border-radius:4px;
   margin-left:.4rem; vertical-align:.08em; text-transform:uppercase; }}
 tr.ph-row > td {{ background:#fff8e6; }}
 .prov {{ margin-top:.35rem; font-size:.75rem; color:var(--muted); line-height:1.7; }}
 .prov .tag {{ display:inline-block; background:#0a3069; color:#fff; font-weight:700;
   font-size:.66rem; letter-spacing:.03em; padding:.02rem .35rem; border-radius:4px;
   margin-right:.35rem; font-family:ui-monospace, Menlo, monospace; }}
 .prov .disp {{ display:inline-block; background:#eaeef2; color:#444; border-radius:4px;
   padding:0 .3rem; font-size:.68rem; margin-right:.35rem; letter-spacing:.02em; }}
 .prov .formula {{ font-family:ui-monospace, Menlo, monospace; font-size:.72rem; }}
 .series {{ font-size:.8rem; color:var(--muted); font-family:ui-monospace, Menlo, monospace;
   margin-top:.25rem; word-break:break-word; }}
 details summary {{ cursor:pointer; font-size:.85rem; color:var(--muted); font-weight:400; }}
 footer {{ margin-top:3rem; padding-top:1rem; border-top:1px solid var(--line);
   color:var(--muted); font-size:.85rem; }}
</style></head><body>
<header><div class="wrap">
  <h1>Multilateral Fund - dashboard metrics</h1>
  <div class="meta">Generated {generated} &middot; {summary}</div>
  <div class="tabs" role="tablist">
    <button role="tab" aria-selected="true" data-tab="fund">Fund</button>
    <button role="tab" aria-selected="false" data-tab="country">Country</button>
  </div>
</div></header>
<div class="wrap">
  <div id="fund">{fund}</div>
  <div id="country" hidden>
    <div class="picker"><label>Country or region
      <select id="pick">{options}</select></label></div>
    <div id="entry"></div>
  </div>
  <footer>Every figure is served by the dashboard metrics API and laid out here
  under the heading it appears beneath on the page. Highlighted rows are
  placeholders: invented so a page can be shown before its data exists, and not
  measurements.</footer>
</div>
<script id="entries" type="application/json">{entries}</script>
<script id="prov" type="application/json">{provenance}</script>
<script>
 var DATA = JSON.parse(document.getElementById("entries").textContent);
 var PROV = JSON.parse(document.getElementById("prov").textContent);
 var panes = {{ fund: document.getElementById("fund"),
                country: document.getElementById("country") }};
 document.querySelectorAll(".tabs button").forEach(function (button) {{
   button.addEventListener("click", function () {{
     document.querySelectorAll(".tabs button").forEach(function (other) {{
       other.setAttribute("aria-selected", String(other === button));
     }});
     Object.keys(panes).forEach(function (name) {{
       panes[name].hidden = name !== button.dataset.tab;
     }});
   }});
 }});
 function show(key) {{
   var entry = DATA[key];
   document.getElementById("entry").innerHTML = !entry ? "" : entry.sections.map(
     function (section) {{
       return "<h2>" + section[0] + "</h2><table>" + section[1].map(function (row) {{
         return "<tr" + (row[2] ? ' class=\\"ph-row\\"' : "") + '><td class=\\"metric\\">'
           + row[0] + (row[2] ? ' <span class=\\"ph\\">placeholder</span>' : "")
           + (PROV[row[3]] || "")
           + '</td><td class=\\"val\\">' + row[1] + "</td></tr>";
       }}).join("") + "</table>";
     }}).join("");
 }}
 document.getElementById("pick").addEventListener("change", function (event) {{
   show(event.target.value);
 }});
 show(document.getElementById("pick").value);
</script>
</body></html>"""


def render_page(
    fund: dict[str, Any], entries: list[dict[str, Any]], generated: str
) -> str:
    """The whole page: the fund laid out, every entry carried as data."""
    data = {
        payload["entry"]["key"]: {
            "sections": [
                [
                    title,
                    [
                        [
                            row["label"],
                            row["value"],
                            row["placeholder"],
                            row["metric_id"],
                        ]
                        for row in rows
                    ],
                ]
                for title, rows in sections(payload)
            ]
        }
        for payload in entries
    }
    # Provenance is a property of the metric, not of the entry, so it is sent
    # once and looked up rather than repeated for all 150-odd countries.
    provenance = {
        row["metric_id"]: _provenance(row["metric_id"])
        for payload in entries
        for _title, rows in sections(payload)
        for row in rows
    }
    options = "".join(
        f'<option value="{escape(payload["entry"]["key"])}">'
        f'{escape(payload["entry"]["name"])}</option>'
        for payload in entries
    )
    summary = f"{len(fund['metrics'])} fund figures &middot; {len(entries)} countries and regions"
    return _PAGE.format(
        generated=escape(generated),
        summary=summary,
        fund=_payload_html(fund),
        options=options,
        # Kept out of the script tag's way; the page fetches nothing.
        entries=json.dumps(data).replace("<", "\\u003c"),
        provenance=json.dumps(provenance).replace("<", "\\u003c"),
    )
