"""
Dashboard export endpoint: GET /api/projects/v2/dashboards/all/

Produces a 5-sheet Excel workbook (Projects, Substances, Funds, Global fields,
MetaProjects) ready for Power BI import with all transformations applied
server-side. See docs/dashboard_export.md for full parameter documentation.
"""

from decimal import Decimal
from time import time

import numpy as np
from constance import config
from django.conf import settings

from core.api.export.projects_v2_dump import (
    ProjectsFundsWriter,
    ProjectsOdsOdpWriter,
    ProjectsV2Dump,
    ProjectsV2DumpWriter,
)
from core.api.utils import workbook_response
from core.api.views.mya_export import HEADERS as MYA_HEADERS
from core.api.views.mya_export import MyaExport


# Poisson rates for mock impact-metric filling, keyed by project class.
# Rates are per $1M of project funding (total_fund).

_MOCK_RATES_INVESTMENT = {
    "number_of_smes_directly_funded_actual": 15.0,
    "number_of_non_sme_directly_funded_actual": 5.0,
    "number_of_both_sme_non_sme_not_directly_funded_actual": 20.0,
}

_MOCK_RATES_NON_INVESTMENT = {
    "total_number_of_technicians_trained_actual": 50.0,
    "number_of_female_technicians_trained_actual": 25.0,
    "total_number_of_trainers_trained_actual": 10.0,
    "number_of_female_trainers_trained_actual": 5.0,
    "total_number_of_technicians_certified_actual": 30.0,
    "number_of_female_technicians_certified_actual": 15.0,
    "number_of_training_institutions_newly_assisted_actual": 2.0,
    "number_of_toolkits_and_equipment_distributed_actual": 25.0,
    "total_number_of_customs_officers_trained_actual": 10.0,
    "number_of_female_customs_officers_trained_actual": 5.0,
    "number_of_bans_on_equipment_actual": 0.5,
    "number_of_bans_on_substances_actual": 0.5,
    "total_number_of_nou_personnel_supported_actual": 2.0,
    "number_of_female_nou_personnel_supported_actual": 1.0,
}

_MOCK_RATES_PRODUCTION = {
    "number_of_production_lines_assisted_actual": 2.0,
}

# Probability of "Yes" for boolean fields (non-investment projects only).
_MOCK_BOOL_PROBS_NON_INVESTMENT = {
    "establishment_of_recovery_and_recycling_scheme_actual": 0.35,
    "establishment_of_reclamation_scheme_actual": 0.25,
    "upgrade_of_imp_exp_licensing_actual": 0.40,
    "upgrade_of_quota_system_actual": 0.30,
    "ee_demonstration_project_actual": 0.30,
    "meps_developed_domestic_refrigeration_actual": 0.25,
    "meps_developed_commercial_refrigeration_actual": 0.20,
    "meps_developed_residential_ac_actual": 0.25,
    "meps_developed_commercial_ac_actual": 0.20,
}

# Base magnitudes for funding-scaled continuous (lognormal) mock fields, keyed
# by project class. Value = approximate median output per $1M of funding. Drawn
# as median * lognormal(0, _MOCK_FLOAT_SIGMA), so values scale with funding,
# stay positive, and are plausible non-integer magnitudes.
_MOCK_FLOAT_RATES_INVESTMENT = {
    "energy_savings_actual": 75_000.0,
}

_MOCK_FLOAT_RATES_NON_INVESTMENT = {
    "quantity_controlled_substances_destroyed_mt_actual": 5.0,
    "quantity_controlled_substances_destroyed_co2_eq_t_actual": 8_000.0,
}

_MOCK_FLOAT_RATES_PRODUCTION = {
    "quantity_hfc_23_by_product_generated_actual": 3.0,
    "quantity_hfc_23_by_product_destroyed_actual": 2.5,
    "quantity_hfc_23_by_product_emitted_actual": 0.3,
}

# Log-space spread for the lognormal float draw. Modest, so values stay within a
# believable band around the funding-scaled median.
_MOCK_FLOAT_SIGMA = 0.4

# Percentage fields drawn uniformly within (low, high), independent of funding
# (a generation rate does not grow with project size).
_MOCK_PERCENT_BOUNDS_PRODUCTION = {
    "hfc_23_by_product_generation_rate_actual": (1.5, 4.0),
}

# The free-text GLOBAL_FIELD_1/2/3 placeholders don't appear to contain real data.
# Excluding them from the export.
_GLOBAL_FIELDS_EXCLUDE = {"GLOBAL_FIELD_1", "GLOBAL_FIELD_2", "GLOBAL_FIELD_3"}


# Geographic / type helpers


def get_country_iso(p, _):
    return p.country.iso3 if p.country else ""


def get_region(p, _):
    if not p.country:
        return ""
    node = p.country.parent
    while node:
        if node.location_type == "Region":
            return node.name
        node = node.parent
    return ""


def get_subregion(p, _):
    if not p.country:
        return ""
    parent = p.country.parent
    if parent and parent.location_type == "Subregion":
        return parent.name
    return ""


def get_type_simple(p, _):
    if p.project_type and p.project_type.code == "INV":
        return "Investment"
    if p.project_type:
        return "Non-Investment"
    return ""


class GlobalFieldsWriter:
    """
    Writes the "Global fields" sheet: one row per PROJECTS_GLOBAL_FIELDS
    constant (the impact/cost-effectiveness values edited from the Projects
    settings UI). Two columns: the human-readable title and the current value.
    """

    def __init__(self, sheet):
        self.sheet = sheet
        self.sheet.append(["Field", "Value"])

    def write(self):
        for name, (_default, title, d_type) in settings.PROJECTS_GLOBAL_FIELDS.items():
            if name in _GLOBAL_FIELDS_EXCLUDE:
                continue
            value = getattr(config, name)
            if d_type == Decimal and isinstance(value, Decimal):
                value = float(value)
            self.sheet.append([title, value])


class DashboardMyaExport(MyaExport):
    """
    MyaExport for the Power BI dashboard: the only spin is excluding metaprojects
    whose umbrella_code still carries a TEMP segment.
    Subclasses MyaExport to keep the base queryset and aggregation logic unchanged.
    """

    def get_meta_projects_queryset(self):
        return (
            super()
            .get_meta_projects_queryset()
            .exclude(umbrella_code__contains="TEMP")
            .order_by("umbrella_code")
        )


class MetaProjectsWriter:
    """
    Writes the "MetaProjects" sheet from DashboardMyaExport rows — same columns,
    labels, and figures as the MYA export. Drops the subtotal/total
    rows and styling for data-only export.
    """

    headers = MYA_HEADERS

    def __init__(self, sheet, view):
        self.sheet = sheet
        self.view = view
        self.sheet.append([h["headerName"] for h in self.headers])

    @staticmethod
    def _cell(row, header):
        # Same lookup as BaseWriter.write_data (so HEADERS' methods like date
        # formatting apply), minus its type coercion — nulls stay blank
        if method := header.get("method"):
            return method(row, header)
        return row.get(header["id"])

    def write(self):
        for row in DashboardMyaExport(self.view).get_meta_project_rows():
            self.sheet.append([self._cell(row, h) for h in self.headers])


class ProjectsDashboardDumpWriter(ProjectsV2DumpWriter):
    """
    Builds the Projects sheet for the dashboard export.

    Extends ProjectsV2DumpWriter. The parent's _build_headers appends
    "Actual funds" / "Actual PSC" on every call, which causes duplicates
    when __init__ calls it twice (once for project fields, once for
    metaproject fields). This subclass overrides _build_headers to strip
    those two columns, then __init__ appends them exactly once along with
    the four geo/type columns specific to this export.
    """

    def __init__(self, sheet, project_fields, metaproject_fields):
        super().__init__(sheet, project_fields, metaproject_fields)
        self.headers += [
            {
                "id": "actual_total_fund",
                "headerName": "Actual funds",
                "method": lambda p, _: self.display_total_fund(p, None),
            },
            {
                "id": "actual_psc",
                "headerName": "Actual PSC",
                "method": lambda p, _: self.display_support_cost_psc(p, None),
            },
            {
                "id": "country_iso",
                "headerName": "country_iso",
                "method": get_country_iso,
            },
            {"id": "region", "headerName": "Region", "method": get_region},
            {"id": "subregion", "headerName": "Sub-Region", "method": get_subregion},
            {
                "id": "type_simple",
                "headerName": "Type Simple",
                "method": get_type_simple,
            },
        ]

    def _build_headers(self, fields, source=None):
        result = super()._build_headers(fields, source)
        return [h for h in result if h["id"] not in ("actual_total_fund", "actual_psc")]


# ---------------------------------------------------------------------------
# Main export class
# ---------------------------------------------------------------------------


class ProjectsDashboardDump(ProjectsV2Dump):
    """
    Produces GET /api/projects/v2/dashboards/all/ — a 5-sheet xlsx workbook
    (Projects, Substances, Funds, Global fields, MetaProjects) with all
    transformations applied server-side.

    Extends ProjectsV2Dump: inherits queryset construction, workbook setup,
    and all field/sheet helpers. Adds query-param-driven filtering, substance
    type cleanup, and optional mock impact-metric filling.

    Query parameters:
      latest_only          — keep only the latest version of each project (default true)
      exclude_production   — drop production projects (default true)
      fill_substance_type  — fill blank substance_type with "HFC" (default false)
      merge_methyl_bromide — reclassify "Methyl Bromide" substance_type as "CFC" (default false)
      mock_data            — fill impact metrics with plausible random values (default true)
      mock_types           — comma-separated substance types to mock (hfc,hcfc,cfc)
      mock_seed            — RNG seed for reproducibility (default 42, not exposed to Swagger UI)
    """

    def __init__(self, view):
        super().__init__(view)

        params = view.request.query_params
        self.latest_only = params.get("latest_only", "true") == "true"
        self.exclude_production = params.get("exclude_production", "true") == "true"
        self.fill_substance_type = params.get("fill_substance_type", "false") == "true"
        self.merge_methyl_bromide = (
            params.get("merge_methyl_bromide", "false") == "true"
        )
        self.mock_data = params.get("mock_data", "true") == "true"
        self.mock_types = {
            t.strip().lower()
            for t in params.get("mock_types", "hfc,hcfc,cfc").split(",")
            if t.strip()
        }
        # Extend the parent queryset with the geo traversal needed for
        # country_iso, Region, and Sub-Region columns.
        self.queryset = self.queryset.select_related("country__parent__parent")

    def _apply_filters(self, projects):
        if self.latest_only:
            projects = [p for p in projects if not p.latest_project_id]
        if self.exclude_production:
            projects = [p for p in projects if not p.production]
        return projects

    def _apply_substance_type_transforms(self, projects):
        for p in projects:
            st = p.substance_type or ""
            if self.fill_substance_type and not st:
                p.substance_type = "HFC"
            elif self.merge_methyl_bromide and st == "Methyl Bromide":
                p.substance_type = "CFC"
        return projects

    @staticmethod
    def _mock_rates_for(p):
        # (numeric_rates, bool_probs, float_rates, percent_bounds) for a
        # project's class. HFC-23 fields live in the production bucket, so they
        # only fill when production projects are in scope (exclude_production=false).
        if p.production:
            return (
                _MOCK_RATES_PRODUCTION,
                {},
                _MOCK_FLOAT_RATES_PRODUCTION,
                _MOCK_PERCENT_BOUNDS_PRODUCTION,
            )
        if p.project_type and p.project_type.code == "INV":
            return (_MOCK_RATES_INVESTMENT, {}, _MOCK_FLOAT_RATES_INVESTMENT, {})
        return (
            _MOCK_RATES_NON_INVESTMENT,
            _MOCK_BOOL_PROBS_NON_INVESTMENT,
            _MOCK_FLOAT_RATES_NON_INVESTMENT,
            {},
        )

    @staticmethod
    def _fill_poisson(p, rng, rates, funding_m):
        # Integer counts scaled by funding: expected count = funding_m * rate.
        for field_name, rate in rates.items():
            lam = max(funding_m * rate, 0.01)
            setattr(p, field_name, float(rng.poisson(lam=lam)))

    @staticmethod
    def _fill_bools(p, rng, probs):
        for field_name, prob in probs.items():
            setattr(p, field_name, "Yes" if rng.random() < prob else "No")

    @staticmethod
    def _fill_lognormal(p, rng, rates, funding_m):
        # Continuous funding-scaled magnitudes. lognormal(0, sigma) has median
        # 1.0, so values center on the funding-scaled base, stay positive, and
        # are plausible non-integers.
        for field_name, base in rates.items():
            median = base * max(funding_m, 0.01)
            value = median * float(rng.lognormal(mean=0.0, sigma=_MOCK_FLOAT_SIGMA))
            setattr(p, field_name, round(value, 2))

    @staticmethod
    def _fill_percent(p, rng, bounds):
        # Bounded percentages, independent of funding.
        for field_name, (low, high) in bounds.items():
            setattr(p, field_name, round(float(rng.uniform(low, high)), 2))

    def _apply_mock_data(self, projects):
        seed = int(self.view.request.query_params.get("mock_seed", "42"))
        rng = np.random.default_rng(seed)

        for p in projects:
            st = (p.substance_type or "").lower()
            in_mock_types = st in self.mock_types or (
                "cfc" in self.mock_types and st not in ("hfc", "hcfc")
            )
            if not in_mock_types:
                continue

            funding_m = max((p.total_fund or 0) / 1_000_000, 0.0)
            numeric_rates, bool_probs, float_rates, percent_bounds = (
                self._mock_rates_for(p)
            )
            self._fill_poisson(p, rng, numeric_rates, funding_m)
            self._fill_bools(p, rng, bool_probs)
            self._fill_lognormal(p, rng, float_rates, funding_m)
            self._fill_percent(p, rng, percent_bounds)

        return projects

    def export(self):
        t0 = time()

        projects = list(self.queryset)
        print(f"Projects queried in {time() - t0:.2f} seconds.")

        projects = self._apply_filters(projects)
        projects = self._apply_substance_type_transforms(projects)
        if self.mock_data:
            projects = self._apply_mock_data(projects)

        version_map = {(p.final_version.id, p.version): p for p in projects}

        odp_writer = ProjectsOdsOdpWriter(self._make_sheet("Substances"))
        funds_writer = ProjectsFundsWriter(self._make_sheet("Funds"), version_map)

        ProjectsDashboardDumpWriter(
            self.sheet_projects,
            self.project_fields,
            self.metaproject_fields,
        ).write(
            projects,
            odp_writer.write,
            funds_writer.write,
        )

        GlobalFieldsWriter(self._make_sheet("Global fields")).write()

        MetaProjectsWriter(self._make_sheet("MetaProjects"), self.view).write()

        print(f"Done in {time() - t0:.2f} seconds.")
        return workbook_response("Projects dashboard dump", self.wb)
