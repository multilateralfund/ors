# Dashboard Export API

`GET /api/projects/v2/dashboards/all/`

Returns a 3-sheet Excel workbook (Projects, Substances, Funds) ready for direct import into Power BI or other tools — no post-processing script needed.

This endpoint replaces the previous workflow of:
1. Downloading the raw dump (`/api/projects/v2/export/?really_all=true`)
2. Running python transformations and filtering locally
3. Importing the output file into Power BI

All transformations that were previously done in Power Query M or in `prepare_powerbi.py` are now applied server-side.

---

## Sheets

| Sheet | Columns | Description |
|-------|---------|-------------|
| **Projects** | ~152 | One row per project (version). Includes all project fields plus `country_iso`, `Region`, `Sub-Region`, and `Type Simple`. |
| **Substances** | 15 | One row per ODS/ODP substance entry per project. |
| **Funds** | 15 | One row per project version with funding approval details. |

---

## Query Parameters

### Filtering

| Parameter | Default | Description |
|-----------|---------|-------------|
| `latest_only` | `true` | Keep only the latest version of each project. When `false`, historical versions are included. |
| `exclude_production` | `true` | Exclude production-sector projects (`Production = "Yes"`). When `false`, production projects are included. |

### Substance type cleanup

| Parameter | Default | Description |
|-----------|---------|-------------|
| `fill_substance_type` | `false` | Fill blank/null `substance_type` values with `"HFC"`.|
| `merge_methyl_bromide` | `false` | Reclassify `substance_type = "Methyl Bromide"` as `"CFC"` rather than keeping it as a separate category. |

### Mock / dummy data

These parameters control filling of impact metric columns with plausible random values for dashboard mockups. Useful when real reported data is sparse or not yet available. Dummy data can be enabled/disabled per substance type.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `mock_data` | `true` | Overall toggle. When `false`, all impact metric columns show only real reported values (often null), no matter if `mock_types` are specified. |
| `mock_types` | `hfc,hcfc,cfc` | Comma-separated list of substance types to apply mock data to. Only projects whose `substance_type` (case-insensitive) matches will be filled. Ignored when `mock_data=false`. `cfc` acts as a catch-all: it matches any substance type that is not `hfc` or `hcfc` (e.g. Methyl Bromide, blank). |

---

## Derived columns (added to Projects sheet)

These columns do not exist in the original raw database export and are added server-side:

| Column | How it's derived |
|--------|-----------------|
| `country_iso` | ISO 3-letter country code (`country.iso3` from the Country model) |
| `Region` | Derived from the Country model's parent hierarchy — walks up until a node with `location_type = "Region"` is found |
| `Sub-Region` | The immediate parent of the country if `location_type = "Subregion"` |
| `Type Simple` | `"Investment"` if `project_type.code == "INV"`, otherwise `"Non-Investment"` |

---

## How mock data filling works

Impact metrics (e.g. "Total number of technicians trained - actual", "Number of SMEs directly funded - actual") are often null because projects haven't submitted final reports yet. The mock filling generates plausible values so dashboards can show complete visualisations during development.

**The values are proportional to funding.** A $1M project will have roughly 10× as many trained technicians as a $100k project. Technically this uses a [Poisson distribution](https://en.wikipedia.org/wiki/Poisson_distribution) where the expected count = `(funding in $M) × rate`. The Poisson distribution produces natural-looking integer counts with realistic variance.

**Different project types get different metrics filled:**
- **Investment projects** (project_type = Investment): enterprise counts — SMEs funded, non-SMEs funded, enterprises included but not directly funded.
- **Non-investment projects** (technical assistance, institutional strengthening, etc.): training metrics — technicians trained/certified, customs officers trained, trainers trained, equipment distributed, bans, licensing upgrades, recovery/recycling scheme establishment.
- **Production projects**: production lines assisted.

**Substance-type gating** (`mock_types`) lets you fill metrics for some substance types while leaving others with real data. For example, `mock_types=hfc` fills only HFC projects, leaving HCFC and CFC projects showing their real (possibly null) values. This supports a phased rollout where data for some substance types has been reported and others haven't.

### Mock data rates reference

Investment projects (per $1M funding):

| Metric | Expected count per $1M |
|--------|----------------------|
| SMEs directly funded | 15 |
| Non-SMEs directly funded | 5 |
| Enterprises included but not directly funded | 20 |

Non-investment projects (per $1M funding):

| Metric | Expected count per $1M |
|--------|----------------------|
| Technicians trained | 50 |
| Female technicians trained | 25 |
| Trainers trained | 10 |
| Female trainers trained | 5 |
| Technicians certified | 30 |
| Female technicians certified | 15 |
| Training institutions newly assisted | 2 |
| Toolkits and equipment distributed | 25 |
| Customs officers trained | 10 |
| Female customs officers trained | 5 |
| Bans on equipment | 0.5 |
| Bans on substances | 0.5 |

Non-investment boolean fields (probability of "Yes"):

| Field | Probability |
|-------|-------------|
| Recovery and recycling scheme established/upgraded | 35% |
| Reclamation scheme established/upgraded | 25% |
| Import/export licensing system upgraded | 40% |
| Quota system upgraded | 30% |

---

## Example requests

Return everything with all defaults (latest versions only, no production, mock data on, no substance type cleanup):
```
GET /api/projects/v2/dashboards/all/
```

Return raw data — no filters, no transforms, no mock data:
```
GET /api/projects/v2/dashboards/all/?latest_only=false&exclude_production=false&mock_data=false
```

Latest versions, real data only (mock off):
```
GET /api/projects/v2/dashboards/all/?mock_data=false
```

Latest versions with substance type cleanup applied (fill blanks as HFC, merge Methyl Bromide into CFC):
```
GET /api/projects/v2/dashboards/all/?fill_substance_type=true&merge_methyl_bromide=true&mock_data=false
```

Mock data for HFC projects only:
```
GET /api/projects/v2/dashboards/all/?mock_types=hfc
```
