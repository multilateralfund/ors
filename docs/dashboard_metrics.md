# Dashboard Metrics API

```
GET /api/dashboard-metrics/fund/              ?apr_year=2024
GET /api/dashboard-metrics/countries/
GET /api/dashboard-metrics/countries/{key}/   ?apr_year=2024
```

The Multilateral Fund's headline figures - the fund-wide "Our Work" page (48 datapoints) and the per-country profile page (42) - served from the ORS database.

Both pages are computed. Thirteen of the 42 per-country rows are declared but blocked: nine on an unsettled question of where a country attribute should live, four on impact columns that are too sparsely reported to publish. They return `available: false`, and `manage.py dashboard_metrics_spec` says why.

---

## Endpoints

| Endpoint | Returns |
|-----------|---------|
| `/fund/` | The fund-wide payload. |
| `/countries/` | Every addressable entry: 149 countries and 5 aggregate regions. |
| `/countries/{key}/` | One entry's payload. |

`{key}` is `iso3` for a country (`BRA`) and `abbr` for a region (`AFR`, `ASP`, `EUR`, `LAC`, `GLO`), matched case-insensitively. One route serves both; `entry.entry_type` discriminates.

### Query parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `apr_year` | newest endorsed APR cycle, falling back to the newest cycle with data | The reporting cycle the APR-derived metrics describe. |

There is no scope parameter. An APR-derived metric carries both the selected cycle and the since-inception total in its value, so one request renders the whole page.

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
  "metrics": [
    {
      "metric_id": "kf_funding_approved",
      "label": "Total funding approved",
      "section": "Key figures",
      "kind": "breakdown",
      "unit": "USD",
      "available": true,
      "value": {"funds_approved": 1455661445.65, "funds_plus_psc": 1571582028.68}
    }
  ]
}
```

The country payload adds `"entry": {"key": "BRA", "name": "Brazil", "entry_type": "country", "iso3": "BRA"}`; `/countries/` returns `{"entries": [...]}` of the same objects.

`kind` and `unit` are **declared**. Clients should not sniff types from the value's shape, or infer currency from label text.

| `kind` | Value |
|---|---|
| `scalar` | a single number or string |
| `breakdown` | an object of named components |
| `table` | a list of rows keyed by a group |
| `series` | `[[year, value], ...]` ascending, unwindowed |

`unit` is one of `USD`, `ODP_TONNES`, `CO2EQ_TONNES`, `COUNT`, `MONTHS`, `KWH_PER_YEAR`, `PERCENT`, or `null`.

A metric that cannot be produced returns `available: false` and `value: null` - never a placeholder string, and never `0`. Values round half-even; a JS client that wants to match must implement banker's rounding.

### The shapes a value takes

| Where | Value |
|---|---|
| Money, as a pair | `{"funds_approved": 3918209498.64, "funds_plus_psc": 4381659171.24}` |
| Project counts (`projects_approved_total`) | `{"projects_by_code": …, "projects_by_metacode": …, "mya_by_metacode": …, "individual_by_code": …}` |
| A group table (`by_agency`, `by_region`) | `[{"group": "UNDP", "projects_by_code": …, "projects_by_metacode": …, "funds_approved": …, "funds_plus_psc": …}, …]` |
| One fund theme (`theme_consumption` …) | the same fields without `"group"` |
| One fund sector (`sector_ac` …) | the same again, plus `"funds_disbursed"`, which is `null` when the cycle reports nothing for that sector |
| `funds_disbursed` | `{"all_time": …, "active_cycle": …}` |
| `investment_timeline` | `{"months_to_first_disbursement": …, "months_to_completion": …}` |
| Country funding by theme (`theme_funding`) | a group table, one row per theme, in chart order |
| Country tonnage by sector (`sector_hfc`, `sector_hcfc`, `sector_other_ods`, `sector_unclassified`) | a group table row per sector bucket, plus `"tonnage"` - what that bucket phases out |
| `scope_excluded_status` | the same four totals fields, over the projects the status rule removed |
| `scope_rollup_mismatch` | `{"projects_affected": …, "odp_project_rollup": …, "odp_substance_rows": …, "co2_project_rollup": …, "co2_substance_rows": …}` |
| A trend (`trend_*`) | `[[1995, 11667.57], …, [2025, 490.35]]` |

The fund page and the country page both have metrics whose ids begin `theme_` and `sector_`, and they are not the same shape: the fund's are one breakdown per theme or sector, the country's are one table covering all of them.

A project is counted at two grains because the page quotes both: `code` counts components, `metacode` counts agreements. A multi-year agreement is many of the first and one of the second.

`by_region` places every in-scope project in exactly one row, so the table totals to `funds_approved` and to `projects_approved_total`. A project names either a country or one of the aggregate region entries, and one that names a region is charted under that region - which is why `Global` is one of the rows.

Two values are numbers the client is expected to dress up: `portfolio_projects_rounded` is the portfolio total rounded down to the nearest thousand and should be rendered with a trailing `+`, and `completed_end_year` is a year and should be rendered without a thousands separator.

A theme or sector with no projects returns zeros rather than `null` - none is a real measurement, and it keeps the chart's bars stable. A whole chart that does not apply is a different thing, and is `null`: a country with no production projects has no production chart, and a substance family that phases nothing out has no pie.

---

## The two pages classify differently

They are different pages with different charts, and three of the classifications genuinely disagree. They are kept apart on purpose; merging any pair would silently move a published figure.

| | Fund-wide | Per country |
|---|---|---|
| Substance family | `ODS` and `HFC`. `ODS` is everything with an ozone-depletion potential, HCFCs included, because the two headline figures are in different units | `HFC`, `HCFC`, `OTHER_ODS` and unresolved. The country page charts HCFCs apart from the pre-HCFC-era substances |
| Sectors | Air-conditioning, Refrigeration, Servicing, Foam, Aerosol, Solvent. Anything else is left out of the sector figures and logged | Air-conditioning, Refrigeration, Foam, Aerosol, Servicing and **Other sectors**. Solvent has no bar of its own and falls in the residual, which is a real bucket rather than a drop |
| Themes | Six, from cluster, sector, funding window and project type, first match wins (`classify.py`) | Nine, from the cluster alone (`taxonomy.py`) |

The country's three families fold back to the fund's two: `ODS` is exactly `HCFC` plus `OTHER_ODS`, and `classify.substance_family` is defined by folding `substance_family_detail`, so the two cannot drift apart.

---

## Consumption and production trends

`trend_ods_consumption`, `trend_hfc_consumption` and `trend_ods_production` come from the Country Programme reports, and the arithmetic is `CPDataExtractionAllExport`'s (`core/api/views/cp_records_export.py`) rather than this package's. It already applies the three consumption rules, the methyl-bromide exemption, and both unit conversions - ODP for section A, CO2-eq via GWP for Annex F. `cp.py` reshapes its output into series and does nothing else. `trend_ods_production` is the exception: it has no counterpart there and reads the standalone `production` column directly.

A year appears because a report exists for it, which is what `get_existent_reports` settles. So a year of zero consumption is kept and rendered - a country reaching zero is the result the programme exists to produce. Production is the opposite case: a country that produces nothing would be a column of zeros, so it returns `null` and the page draws no chart.

Records reach all of this through `get_final_records_for_years` (`core/api/views/utils.py`), which takes the FINAL report for each country-year and the highest-versioned archived one only where no FINAL exists. That rests on `cp_report` holding at most one FINAL row per country and year, which nothing in the schema enforces.

---

## Guarantees

**The payload is identical for every authenticated caller.** These figures are destined for a public page, so there is no per-user narrowing anywhere in this package: it never calls `ProjectV2ViewSet.filter_permissions_queryset` and never calls `scope_mya_queryset_to_user_agency`.

Nothing internal appears in a payload - no formulas, no model field names, no data-quality diagnostics, no raw data.

---

## Scope

One rule set, applied to every figure on both pages.

| Rule | Value |
|------|-------|
| Population | Latest version only (`Project.objects`, which filters `latest_project=None`) |
| Excluded statuses | `Transferred`, `Closed` - everywhere, with the excluded count and amount reported as their own metric |
| Production projects | Included |
| Funding basis | Raw `Project.total_fund` / `support_cost_psc` |

`core/api/dashboard_metrics/primitives.py` is the single place these are decided.

---

## Bad data degrades one entry, not the endpoint

| Condition | Client sees | Operator sees |
|---|---|---|
| project-bearing country with no `iso3`/`abbr` | entry absent from `/countries/` | `WARNING` naming the countries |
| two entries claiming one key | **neither** entry served; the key 404s | `ERROR` naming the key and both claimants |
| live cluster with no theme mapping | nothing - its funding is reported as `theme_unmapped` | - |
| a metric raises | that one metric is `available: false` | `ERROR` with the traceback, naming the metric |
| a sector outside the six charted ones | nothing - it is absent from the sector figures | `INFO` naming the sectors and their funding |
| a funding window whose decision and description name different windows | nothing - the decision wins | `WARNING` naming the window and both readings |

Serving neither side of a key collision is deliberate: picking one would publish its figures under the other's name, which is the only failure here a consumer could not detect.

Both conditions are hard assertions in `core/api/tests/test_dashboard_metrics.py` (`assert_entry_keys_disjoint`, `assert_clusters_mapped`), which is where a person actually finds out.

---

## How a figure is computed

Each datapoint is declared once, as a `Metric` in `core/api/dashboard_metrics/fund.py` (fund-wide metrics) or `country.py` (per-country metrics), carrying its label, section, kind, unit and a `compute` callable. Adding a datapoint is one entry.

A `compute` takes the request's `MetricContext` (`context.py`) and returns a value, or `None` if it has none. The context fetches each source once and hands the same result to every metric, so the fund page's forty-eight figures cost a couple of dozen queries rather than forty-eight sweeps:

| Source | What it holds |
|---|---|
| `context.projects` | the in-scope projects, each already bucketed by theme, sector and substance family (`classify.py`) |
| `context.excluded` | the projects the Transferred/Closed rule removes, so the removal can be reported |
| `context.apr` | the selected reporting cycle's project reports |
| `context.cp` | every country's reported consumption and production, computed for the whole portfolio at once |
| `context.pledged` | cumulative pledged contributions |

`context.country` is what makes a per-country payload: set it and every source above narrows to that country, so the same `compute` functions serve both pages. It is `None` for the fund-wide payload.

Where ORS already computes something, this package inherits it rather than restating it: `AprMetrics` (`apr.py`) subclasses `APRSummaryTablesExportWriter` and replaces only its constructor, so the disbursement, month-averaging and grouping arithmetic is the export's own. Months are therefore whole months, truncated - the export's convention - and an average over a set where nothing is measurable is `null`, not `0`.

Classification reads `ProjectCluster.code`, `ProjectSector.code` and `ProjectType.code`, never a display name, and takes the production test from `ProjectCluster.production` alongside `Project.production` and the production sector. It does not read `Project.substance_type`, which is deprecated and mostly null.

The one place this package restates rather than inherits is `classify.region_of`, which walks a country's parent chain to find its region. The dashboard export answers the same question, but importing it needs a function-body import to break a cycle, which is more machinery than the four lines it saves. `region_bucket` sits beside it and answers the charting question rather than the geographic one, alongside `sector_bucket`: a region is under no region, but a project that names one still belongs in its bar.

Alongside those, each `Metric` carries documentation - formula, source, model field - that is **not served**. To render a table of all metrics with full fields:

```
./manage.py dashboard_metrics_spec > dashboard_metrics_spec.md
```

---

## Storage

Computed per request; no caching yet. The fund payload is around two dozen queries and a few seconds against a portfolio of ten thousand projects, nearly all of it in Python rather than in the database.

A country payload is much slower - around a minute - and effectively all of it is `context.cp`; the other 41 metrics together cost about a tenth of a second. Most of that minute is not the trends computation itself but `get_archive_reports_final_for_years` (`core/api/views/utils.py`), which builds one `exclude()` clause per country programme report on record. It takes around eleven seconds on the current data, `get_final_records_for_years` calls it once, and a country payload calls that four times. Making it a single subquery takes the payload to about eight seconds with every value unchanged, and would speed up the country programme exports too; it is left alone here because it is not this package's to change.

`get_fund_metrics()` and `get_country_metrics()` are the seams a cache would wrap, if that is still wanted afterwards.
