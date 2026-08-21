# Dashboard Metrics API

```
GET /api/dashboard-metrics/fund/              ?apr_year=2024
GET /api/dashboard-metrics/countries/
GET /api/dashboard-metrics/countries/{key}/   ?apr_year=2024
```

The Multilateral Fund's headline figures - the fund-wide "Our Work" page (48 datapoints) and the per-country profile page (42) - served from the ORS database.

The registry, the envelope and the routes are in place. The metric computations are not written yet, so every metric currently returns `available: false`.

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

Serving neither side of a key collision is deliberate: picking one would publish its figures under the other's name, which is the only failure here a consumer could not detect.

Both conditions are hard assertions in `core/api/tests/test_dashboard_metrics.py` (`assert_entry_keys_disjoint`, `assert_clusters_mapped`), which is where a person actually finds out.

---

## The metric registry

Each datapoint is declared once, as a `Metric` in `core/api/dashboard_metrics/fund.py` (fund-wide metrics) or `country.py` (per-country metrics), carrying its label, section, kind, unit and a `compute` callable. Adding a datapoint is one entry.

Alongside those, each `Metric` carries documentation - formula, source, model field - that is **not served**. To render a table of all metrics with full fields:

```
./manage.py dashboard_metrics_spec > dashboard_metrics_spec.md
```

---

## Storage

Computed per request; no caching yet.
