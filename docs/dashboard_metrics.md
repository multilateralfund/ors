# Dashboard Metrics API

```
GET /api/dashboard-metrics/fund/              ?apr_year=2024  ?placeholders=true
GET /api/dashboard-metrics/countries/
GET /api/dashboard-metrics/countries/{key}/   ?apr_year=2024  ?placeholders=true
```

An API to feed metrics for the fund-wide "Our Work" page and the per-country profile page.

---

## Endpoints

| Endpoint            | Returns                                                                  |
|---------------------|--------------------------------------------------------------------------|
| `/fund/`            | The fund-wide payload.                                                   |
| `/countries/`       | List of every addressable entry: 149 countries and 5 aggregate regions. |
| `/countries/{key}/` | One country's payload.                                                   |

`{key}` is `iso3` for a country (`BRA`) and `abbr` for a region (`AFR`, `ASP`, `EUR`, `LAC`, `GLO`), 
matched case-insensitively. One route serves both; `entry.entry_type` discriminates.

### Query parameters

| Parameter      | Default                   | Description                                                                |
|----------------|---------------------------|----------------------------------------------------------------------------|
| `apr_year`     | newest endorsed APR cycle | The reporting cycle the APR-derived metrics use.                           |
| `placeholders` | `false`                   | Serve stand-ins for the datapoints that have no source or incomplete data. |

---

## Response shape

```jsonc
{
  "as_of": "2026-08-21T09:12:44Z",
  "apr_year": 2024,
  "apr_years_available": [2021, 2022, 2023, 2024],
  "scope": {
    "population": "latest",
    "excluded_statuses": ["Closed", "Transferred"],
    "production_included": true
  },
  "metrics": {
    "kf_funding_approved": {
      "metric_id": "kf_funding_approved",
      "label": "Total funding approved",
      "section": "Key figures",
      "kind": "breakdown",
      "unit": "USD",
      "available": true,
      "value": {"funds_approved": 1455661445.65, "funds_plus_psc": 1571582028.68}
    }
  }
}
```

`metrics` is an object keyed by `metric_id`, so a client addresses a figure rather than scanning for it. 
Each value still carries its own `metric_id`, so iterating `.values()` loses nothing.

The country payload adds `"entry": {"key": "BRA", "name": "Brazil", "entry_type": "country", "iso3": "BRA"}`; 
`/countries/` returns `{"entries": [...]}` of the same objects.

`kind` and `unit` are **declared** so clients do not need to sniff types from the value's shape, or infer 
currency from label text.

| `kind`      | Value                                        |
|-------------|----------------------------------------------|
| `scalar`    | a single number or string                    |
| `breakdown` | an object of named components                |
| `table`     | a list of rows keyed by a group              |
| `series`    | `[[year, value], ...]` ascending, unwindowed |

`unit` is one of `USD`, `ODP_TONNES`, `CO2EQ_TONNES`, `COUNT`, `MONTHS`, `KWH_PER_YEAR`, `PERCENT`, or `null`.

A metric that cannot be produced returns `available: false` and `value: null` - never a placeholder string, 
and never `0`, unless the caller asked for one with `?placeholders=true`. Values round half-even; a JS client 
that wants to match must implement banker's rounding.

### The shapes a value takes

| Where                                                                                              | Value                                                                                                                          |
|----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Money, as a pair                                                                                   | `{"funds_approved": 3918209498.64, "funds_plus_psc": 4381659171.24}`                                                           |
| Project counts (`projects_approved_total`)                                                         | `{"projects_by_code": …, "projects_by_metacode": …, "mya_by_metacode": …, "individual_by_code": …}`                            |
| A group table (`by_agency`, `by_region`)                                                           | `[{"group": "UNDP", "projects_by_code": …, "projects_by_metacode": …, "funds_approved": …, "funds_plus_psc": …}, …]`           |
| One fund theme (`theme_consumption` …)                                                             | the same fields without `"group"`                                                                                              |
| One fund sector (`sector_ac` …)                                                                    | the same again, plus `"funds_disbursed"`, which is `null` when the cycle reports nothing for that sector                       |
| `funds_disbursed`                                                                                  | `{"all_time": …, "active_cycle": …}`                                                                                           |
| The two LVC splits (`funds_lvc_split`, `funds_disbursed_lvc_split`)                                | `{"lvc": …, "non_lvc": …, "not_classified": …}`, each component shaped like the undivided figure                               |
| `investment_timeline`                                                                              | `{"months_to_first_disbursement": …, "months_to_completion": …}`                                                               |
| Country funding by theme (`theme_funding`)                                                         | a group table, one row per theme, in chart order                                                                               |
| Country tonnage by sector (`sector_hfc`, `sector_hcfc`, `sector_other_ods`, `sector_unclassified`) | a group table row per sector bucket, plus `"tonnage"` - what that bucket phases out                                            |
| `scope_excluded_status`                                                                            | the same four totals fields, over the projects the status rule removed                                                         |
| `scope_rollup_mismatch`                                                                            | `{"projects_affected": …, "odp_project_rollup": …, "odp_substance_rows": …, "co2_project_rollup": …, "co2_substance_rows": …}` |
| A trend (`trend_*`)                                                                                | `[[1995, 11667.57], …, [2025, 490.35]]`                                                                                        |

The fund page and the country page both have metrics whose ids begin `theme_` and `sector_`, and they are not 
the same shape: the fund's are one breakdown per theme or sector, the country's are one table covering all of them.

A project is counted at two grains because the page quotes both: `code` counts project rows, `metacode` 
counts multi-year agreements. A multi-year agreement is many of the first and one of the second.

`by_region` places every in-scope project in exactly one row, so the table totals to `funds_approved` and 
to `projects_approved_total`. A project names either a country or one of the aggregate region entries, and one 
that names a region is charted under that region - which is why `Global` is one of the rows.

Two values are numbers the client is expected to dress up: `portfolio_projects_rounded` is the portfolio total 
rounded down to the nearest thousand and should be rendered with a trailing `+`, and `completed_end_year` is a year 
and should be rendered without a thousands separator.

A theme or sector with no projects returns zeros rather than `null` to keep the chart's bars stable. 
A whole chart that does not apply is a different thing, and is `null`: a country with no 
production projects has no production chart, and a substance family that phases nothing out has no pie.

---

## Scope

One rule set, applied to every figure on both pages.

| Rule                | Value                                                                                                 |
|---------------------|-------------------------------------------------------------------------------------------------------|
| Population          | Latest version only (`Project.objects`, which filters `latest_project=None`)                          |
| Excluded statuses   | `Transferred`, `Closed` - everywhere, with the excluded count and amount reported as their own metric |
| Production projects | Included                                                                                              |
| Funding basis       | Raw `Project.total_fund` / `support_cost_psc`                                                         |

`core/api/dashboard_metrics/primitives.py` is the single place these are decided.

---

## How a figure is computed

Each datapoint is declared once, as a `Metric` in `core/api/dashboard_metrics/fund.py` (fund-wide metrics) or 
`country.py` (per-country metrics), carrying its label, section, kind, unit and a `compute` callable. 
Adding a datapoint is one entry - see [Adding a metric](#adding-a-metric).

A `compute` takes the request's `MetricContext` (`context.py`) and returns a value, or `None` if it has none. 
The context fetches each source once and hands the same result to every metric, so the API call's figures
cost a couple of dozen queries rather than an independent sweep per metric:

| Source             | What it holds                                                                                      |
|--------------------|----------------------------------------------------------------------------------------------------|
| `context.projects` | the in-scope projects, each already bucketed by theme, sector and substance family (`classify.py`) |
| `context.excluded` | the projects the Transferred/Closed rule removes, so the removal can be reported                   |
| `context.apr`      | the selected reporting cycle's project reports                                                     |
| `context.cp`       | every country's reported consumption and production, computed for the whole portfolio at once      |
| `context.pledged`  | cumulative pledged contributions                                                                   |

`context.country` is what makes a per-country payload: set it and every source above narrows to that country, 
so the same `compute` functions serve both pages. It is `None` for the fund-wide payload.

Where ORS already computes something, this package inherits it rather than restating it: `AprMetrics` (`apr.py`) 
subclasses `APRSummaryTablesExportWriter` and replaces only its constructor, so the disbursement, month-averaging 
and grouping arithmetic is the export's own. Months are therefore whole months, truncated - the export's convention - 
and an average over a set where nothing is measurable is `null`, not `0`.

Classification reads `ProjectCluster.code`, `ProjectSector.code` and `ProjectType.code`, never a display name, and 
takes the production test from `ProjectCluster.production` alongside `Project.production` and the production sector.
It does not read `Project.substance_type`.

The one place this package restates rather than inherits is `classify.region_of`, which walks a country's parent chain 
to find its region. The dashboard export answers the same question, but importing it needs a function-body import 
to break a cycle, which is more machinery than the four lines it saves. `region_bucket` sits beside it and answers 
the charting question rather than the geographic one, alongside `sector_bucket`: a region is under no region, but a 
project that names one still belongs in its bar.

Alongside those, each `Metric` carries documentation - formula, source, model field - that is **not served**. 
To render a table of all metrics with full fields:

```
./manage.py dashboard_metrics_spec > dashboard_metrics_spec.md
```

---

## Adding a metric

**1. Write the `compute` function.** It takes the `MetricContext` and returns the value, or `None` when there is 
nothing behind the figure. Read the sources in the table above rather than querying `Project` directly - that 
is what keeps a payload to a couple of dozen queries. Put it in `fund.py` or `country.py` next to its 
neighbors; the helpers in `primitives.py` (`totals`, `grouped`, `project_counts`, `phase_out`) cover most shapes.

```python
def funds_by_sector(context: MetricContext) -> list[dict[str, Any]]:
    """Delivery split across the sectors the Fund's projects sit in."""
    return grouped(context.projects, lambda row: row.sector_bucket)
```

`context.projects` hands back `ClassifiedProject` rows, not bare `Project`s: each one already carries its 
`theme`, `sector_bucket`, `family` and `is_production`, worked out once for the whole payload.

**2. Declare the `Metric`** in the same file's `FUND_METRICS` or `COUNTRY_METRICS` tuple.

```python
Metric(
    metric_id="funds_by_window",
    label="Funding by window",          # no digits and no "$" - a test enforces it
    section="Delivery",                 # the page heading it sits under
    kind=Kind.TABLE,
    unit=Unit.USD,
    disposition=Disposition.COMPUTE,
    formula="sum(total_fund + support_cost_psc) grouped by funding window",
    db_source="DB-COMPUTABLE",
    src_model_field="Project.funding_window",
    compute=funds_by_window,
),
```

`formula`, `db_source` and `src_model_field` are documentation and are **never served**; they exist for 
`dashboard_metrics_spec`. `kind` and `unit` *are* served, and clients rely on them, so they must describe what 
`compute` actually returns.

**3. Pin the id** in `FUND_METRIC_IDS` or `COUNTRY_METRIC_IDS` at the top of 
`core/api/tests/test_dashboard_metrics.py`.

**4. Run the gates.**

```
docker exec -w /app mlf.app pytest -q core/api/tests/test_dashboard_metrics.py
docker exec -w /app mlf.app black --check core
docker exec -w /app mlf.app pylint core
```

### Declaring one that cannot be computed yet

Set `compute=None` and give an `unavailable_reason`. The metric still appears in the payload, as 
`available: false` with `value: null`, so the page can render the row and say nothing rather than omitting it. 
Use `Disposition.NOT_AVAILABLE`, and keep the reason free of internal detail - it is read through 
`dashboard_metrics_spec`, not served.

A metric that *raises* is handled the same way from the client's side, so a new `compute` cannot take the 
endpoint down: the failure is logged with its traceback and that one metric goes unavailable.

### Giving it a stand-in

A metric may also declare a `placeholder` callable, in `placeholders.py`. It runs only for a caller that asked 
for one, and its result **replaces** whatever `compute` returned - so the registry refuses a placeholder on a 
fully computed metric. Either `compute` is `None`, or the metric is declared `COMPUTE_PARTIAL` to say its value has 
gaps a stand-in is meant to fill. `disposition` gains no placeholder value of its own: it describes the state of 
the source, which a stand-in does not change.

Seed anything random on `context.seed_key` so one entry gets the same answer on every request. Two metrics 
that are the same fact seed on the same slug so they cannot disagree.

---

## Unavailable metrics, and `?placeholders=true`

Thirteen of the 42 per-country rows are declared but blocked: nine on country attributes that have no field to 
live in yet, and four on impact columns that are too sparsely reported to publish. They return `available: false`, 
and `manage.py dashboard_metrics_spec` says why. Every fund row is served.

`?placeholders=true` fills them with invented values so a page can be built and demonstrated before its data 
arrives. **It is off by default and nothing invented ever reaches a default payload.** Every invented value 
carries `"placeholder": true`:

```jsonc
"impact_technicians": {
  "metric_id": "impact_technicians",
  "available": true,
  "value": 1437,
  "placeholder": true          // invented; do not publish
}
```

The key is **absent** on a real figure rather than `false`, so a genuine value can never be mistaken for a 
stand-in. Treat its presence, at any level, as "this must not be published".

A stand-in respects what the entry actually is. The nine country attributes stay `available: false` on the five 
aggregate entries, exactly as the real attributes do - a region has no licensing system or ozone officer of its 
own - while the four impact counts are served there, because people trained across a region is a figure the 
page can meaningfully show.

`baseline_phased_out_by_substance` is the one metric that is only *partly* invented. It always serves all three 
rows, so the chart keeps its shape. Its Other ODS row is a real 100%, because Article 5 countries have completely 
phased those substances out; the other two are `null` by default because the ORS does not yet have the baselines.

```jsonc
// default
"value": [
  {"group": "HFC",       "value": null},
  {"group": "HCFC",      "value": null},
  {"group": "OTHER_ODS", "value": 100.0}
]
```

With `?placeholders=true` the two nulls are filled, and flagged twice over - on the rows that are invented, and on 
the metric, so a client can detect "contains invented data" without walking rows:

```jsonc
"baseline_phased_out_by_substance": {
  "available": true,
  "placeholder": true,
  "value": [
    {"group": "HFC",       "value": 61.2,  "placeholder": true},
    {"group": "HCFC",      "value": 44.8,  "placeholder": true},
    {"group": "OTHER_ODS", "value": 100.0}
  ]
}
```

The metric is `available: true` either way. What changes is only whether the two unknown rows carry a number.
