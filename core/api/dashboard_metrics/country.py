"""
The 42 per-country metric declarations.
"""

from core.api.dashboard_metrics.registry import (
    Disposition,
    Kind,
    Metric,
    Unit,
    index_metrics,
)

COUNTRY_METRICS: tuple[Metric, ...] = (
    Metric(
        metric_id="scope_entry_type",
        label="Entry type",
        section="Scope & assumptions",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="country vs aggregate (Global / Europe / 'Region: …')",
        db_source="DB-COMPUTABLE",
        src_model_field="Country.location_type",
        compute=None,
    ),
    Metric(
        metric_id="scope_excluded_status",
        label="Projects excluded as Transferred or Closed",
        section="Scope & assumptions",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula=(
            "latest rows where status in (Transferred, Closed) - removed from EVERY "
            "figure below"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field="Project.status",
        compute=None,
    ),
    Metric(
        metric_id="scope_no_code",
        label="Projects in scope with no project code",
        section="Scope & assumptions",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.COMPUTE,
        formula="latest, non-excluded rows where code is null",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.code",
        compute=None,
    ),
    Metric(
        metric_id="scope_rollup_mismatch",
        label="Phase-out hidden by a stale project roll-up",
        section="Scope & assumptions",
        kind=Kind.BREAKDOWN,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula=(
            "projects where sum(Substances sheet per-substance phase-out) != Projects "
            "sheet 'Total phase-out'"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field=(
            "Project.total_phase_out_odp_tonnes / _co2_tonnes  vs  ProjectOdsOdp.odp "
            "/ .co2_mt"
        ),
        compute=None,
    ),
    Metric(
        metric_id="attr_country_name",
        label="Country name",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="dashboard export 'Country' column",
        db_source="DB-COMPUTABLE",
        src_model_field="Country.name",
        compute=None,
    ),
    Metric(
        metric_id="attr_iso3",
        label="ISO3",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="dashboard export 'country_iso' column",
        db_source="DB-COMPUTABLE",
        src_model_field="Country.iso3",
        compute=None,
    ),
    Metric(
        metric_id="attr_region",
        label="Region",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="dashboard export 'Region' column (drives the dynamic footer)",
        db_source="DB-COMPUTABLE",
        src_model_field="Country.parent chain",
        compute=None,
    ),
    Metric(
        metric_id="attr_ods_licensing",
        label="ODS licensing system",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country attribute - does an ODS import/export licensing system exist",
        db_source="SOURCE-UNDECIDED",
        src_model_field="Project.upgrade_of_imp_exp_licensing",
        compute=None,
        unavailable_reason=(
            "No country-level licensing field. Project.upgrade_of_imp_exp_licensing "
            "is per-project planned/actual reporting, not a country attribute. Source "
            "undecided."
        ),
    ),
    Metric(
        metric_id="attr_ods_quota",
        label="ODS quota system",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country attribute - does an ODS quota system exist",
        db_source="SOURCE-UNDECIDED",
        src_model_field="Project.upgrade_of_quota_system",
        compute=None,
        unavailable_reason=(
            "No country-level quota field. Project.upgrade_of_quota_system is per- "
            "project, not a country flag. Source undecided."
        ),
    ),
    Metric(
        metric_id="attr_hfc_licensing",
        label="HFC licensing system",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country attribute - HFC-specific licensing system",
        db_source="SOURCE-UNDECIDED",
        src_model_field="none",
        compute=None,
        unavailable_reason=(
            "No HFC-specific licensing field exists: the model has no ODS/HFC split, "
            "only a single generic licensing field. Source undecided."
        ),
    ),
    Metric(
        metric_id="attr_hfc_quota",
        label="HFC quota system",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country attribute - HFC-specific quota system",
        db_source="SOURCE-UNDECIDED",
        src_model_field="none",
        compute=None,
        unavailable_reason=(
            "No HFC-specific quota field exists (no ODS/HFC split). Source undecided."
        ),
    ),
    Metric(
        metric_id="attr_hfc_group",
        label="Country classification (HFC)",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="Country.consumption_group (e.g. 'I' / 'II')",
        db_source="DB-COMPUTABLE",
        src_model_field="Country.consumption_group",
        compute=None,
    ),
    Metric(
        metric_id="attr_hcfc_lvc",
        label="Country classification (HCFC)",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE,
        formula="Country.is_lvc (+ consumption_category label)",
        db_source="DB-COMPUTABLE",
        src_model_field="Country.is_lvc",
        compute=None,
    ),
    Metric(
        metric_id="attr_nou_ministry",
        label="NOU ministry",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.COMPUTE_PARTIAL,
        formula="Country.ozone_unit (free text - holds the ministry/office name)",
        db_source="DB-COMPUTABLE-AMBIGUOUS",
        src_model_field="Country.ozone_unit",
        compute=None,
    ),
    Metric(
        metric_id="attr_nou_name",
        label="NOU contact person",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country attribute - NOU contact person name",
        db_source="SOURCE-UNDECIDED",
        src_model_field="none",
        compute=None,
        unavailable_reason=(
            "No contact-person field on Country. Country.ozone_unit holds the "
            "ministry/office name and feeds attr_nou_ministry instead. Source "
            "undecided."
        ),
    ),
    Metric(
        metric_id="attr_certification",
        label="Competence certification system established",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country attribute - YES/NO",
        db_source="SOURCE-UNDECIDED",
        src_model_field="Project.establishment_of_technician_certification",
        compute=None,
        unavailable_reason=(
            "Only per-project Project.establishment_of_technician_certification "
            "exists; there is no country roll-up. Source undecided."
        ),
    ),
    Metric(
        metric_id="attr_meps",
        label="MEPS from funded projects",
        section="Regulatory status",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country attribute - YES/ESTABLISHED",
        db_source="SOURCE-UNDECIDED",
        src_model_field="Project.meps_developed_domestic_refrigeration",
        compute=None,
        unavailable_reason=(
            "Only per-project Project.meps_developed_* (split by equipment type) "
            "exists; there is no country roll-up. Source undecided."
        ),
    ),
    Metric(
        metric_id="kf_projects_approved",
        label="Total number of projects approved",
        section="Key figures",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.COMPUTE,
        formula=(
            "count(distinct code), latest version, excluding status "
            "Transferred/Closed"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field="Project.code",
        compute=None,
    ),
    Metric(
        metric_id="kf_projects_ongoing",
        label="Total number of projects ongoing",
        section="Key figures",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.COMPUTE,
        formula="count(distinct code) where status == Ongoing",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.status",
        compute=None,
    ),
    Metric(
        metric_id="kf_funding_approved",
        label="Total funding approved",
        section="Key figures",
        kind=Kind.BREAKDOWN,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum(Project funding + PSC), latest version, excluding status "
            "Transferred/Closed"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_fund + support_cost_psc",
        compute=None,
    ),
    Metric(
        metric_id="kf_funding_disbursed",
        label="Total funding disbursed",
        section="Key figures",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="sum(Funds Disbursed (US$)) from the APR export for the country",
        db_source="NEEDS-APR",
        src_model_field="AnnualProjectReport.funds_disbursed",
        compute=None,
    ),
    Metric(
        metric_id="kf_odp_phased",
        label="Total ODP phased out, actual",
        section="Key figures",
        kind=Kind.SCALAR,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum(Consumption Phased Out (ODP tonnes) + Production Phased Out (ODP "
            "tonnes)) from the APR"
        ),
        db_source="NEEDS-APR",
        src_model_field=(
            "AnnualProjectReport.consumption_phased_out_odp + "
            "production_phased_out_odp"
        ),
        compute=None,
    ),
    Metric(
        metric_id="kf_odp_approved",
        label="Total ODP approved, planned",
        section="Key figures",
        kind=Kind.SCALAR,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula="sum(Total phase-out (ODP tonnes)) - the approved/planned total",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_phase_out_odp_tonnes",
        compute=None,
    ),
    Metric(
        metric_id="kf_co2_phased",
        label="Total CO2-eq phased out, actual",
        section="Key figures",
        kind=Kind.SCALAR,
        unit=Unit.CO2EQ_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum(Consumption Phased Out (CO2-eq tonnes) + Production Phased Out "
            "(CO2-eq tonnes)) from the APR"
        ),
        db_source="NEEDS-APR",
        src_model_field=(
            "AnnualProjectReport.consumption_phased_out_co2 + "
            "production_phased_out_co2"
        ),
        compute=None,
    ),
    Metric(
        metric_id="kf_co2_approved",
        label="Total CO2-eq approved, planned",
        section="Key figures",
        kind=Kind.SCALAR,
        unit=Unit.CO2EQ_TONNES,
        disposition=Disposition.COMPUTE,
        formula="sum(Total phase-out (CO2-eq tonnes)) - the approved/planned total",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_phase_out_co2_tonnes",
        compute=None,
    ),
    Metric(
        metric_id="trend_ods_consumption",
        label="ODS consumption over time",
        section="Consumption & production trends",
        kind=Kind.SERIES,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula="per year: backend get_consumption_value over section-A records (ODP)",
        db_source="DB-COMPUTABLE-CP",
        src_model_field="CPRecord.imports/exports/production (section A)",
        compute=None,
    ),
    Metric(
        metric_id="trend_hfc_consumption",
        label="HFC consumption over time",
        section="Consumption & production trends",
        kind=Kind.SERIES,
        unit=Unit.CO2EQ_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "per year: backend get_consumption_value over Annex-F records "
            "(CO2-eq/GWP)"
        ),
        db_source="DB-COMPUTABLE-CP",
        src_model_field="CPRecord (Annex F)",
        compute=None,
    ),
    Metric(
        metric_id="trend_ods_production",
        label="ODS production over time",
        section="Consumption & production trends",
        kind=Kind.SERIES,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "per year: sum of the 'production' metric over the country's CP records"
        ),
        db_source="DB-COMPUTABLE-CP",
        src_model_field="CPRecord.production",
        compute=None,
    ),
    Metric(
        metric_id="theme_funding",
        label="Funding by project theme",
        section="Funding by project theme",
        kind=Kind.TABLE,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula=(
            "group the country's projects by the Cluster→Aggregation map (Cluster "
            "list_ey copy.xlsx); sum funding+PSC"
        ),
        db_source="DB-COMPUTABLE-MAPPED",
        src_model_field="Project.cluster + Cluster list_ey copy.xlsx",
        compute=None,
    ),
    Metric(
        metric_id="theme_total",
        label="Total funding approved across all themes",
        section="Funding by project theme",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="sum(funding+PSC) over the country",
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_fund + psc",
        compute=None,
    ),
    Metric(
        metric_id="theme_unmapped",
        label="Funding on projects whose cluster has no theme",
        section="Funding by project theme",
        kind=Kind.SCALAR,
        unit=Unit.USD,
        disposition=Disposition.COMPUTE,
        formula="funding whose Cluster has no Aggregation in Cluster list_ey copy.xlsx",
        db_source="DB-COMPUTABLE-MAPPED",
        src_model_field="Project.cluster + Cluster list_ey copy.xlsx",
        compute=None,
    ),
    Metric(
        metric_id="sector_hfc",
        label="HFC tonnage approved by sector",
        section="Tonnage approved by sector",
        kind=Kind.TABLE,
        unit=Unit.CO2EQ_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum Projects-sheet 'Total phase-out (CO2-eq tonnes)' by Sector bucket, "
            "for projects whose substance family is HFC; consumption only"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field=(
            "Project.substance_type + Project.sector + "
            "Project.total_phase_out_co2_tonnes"
        ),
        compute=None,
    ),
    Metric(
        metric_id="sector_hcfc",
        label="HCFC tonnage approved by sector",
        section="Tonnage approved by sector",
        kind=Kind.TABLE,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum Projects-sheet 'Total phase-out (ODP tonnes)' by Sector bucket, for "
            "projects whose substance family is HCFC; consumption only"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field=(
            "Project.substance_type + Project.sector + "
            "Project.total_phase_out_odp_tonnes"
        ),
        compute=None,
    ),
    Metric(
        metric_id="sector_other_ods",
        label="Other ODS tonnage approved by sector",
        section="Tonnage approved by sector",
        kind=Kind.TABLE,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum CFC / halon / CTC / TCA / methyl-bromide phase-out (ODP) by Sector "
            "bucket; consumption only"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field=(
            "Project.substance_type + Project.sector + "
            "Project.total_phase_out_odp_tonnes"
        ),
        compute=None,
    ),
    Metric(
        metric_id="sector_unclassified",
        label="Tonnage on projects with no resolvable substance family",
        section="Tonnage approved by sector",
        kind=Kind.TABLE,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum phase-out (ODP) where neither substance_type nor Cluster resolves to "
            "HFC/HCFC/other-ODS"
        ),
        db_source="DB-COMPUTABLE-AMBIGUOUS",
        src_model_field="Project.substance_type / Project.cluster",
        compute=None,
    ),
    Metric(
        metric_id="prod_tonnage",
        label="Production tonnage phased out",
        section="Production & energy efficiency",
        kind=Kind.SCALAR,
        unit=Unit.ODP_TONNES,
        disposition=Disposition.COMPUTE,
        formula=(
            "sum(Total phase-out (ODP tonnes)) over the country's production projects"
        ),
        db_source="DB-COMPUTABLE",
        src_model_field="Project.total_phase_out_odp_tonnes (production)",
        compute=None,
    ),
    Metric(
        metric_id="ee_kwh_saved",
        label="Energy saved per year",
        section="Production & energy efficiency",
        kind=Kind.SCALAR,
        unit=Unit.KWH_PER_YEAR,
        disposition=Disposition.NOT_AVAILABLE,
        formula=(
            "sum(Projects sheet 'Energy savings - actual (kWh/year)') over the "
            "country's projects"
        ),
        db_source="IMPACT-UNPOPULATED",
        src_model_field=(
            'Project.energy_savings_actual  [export column: "Energy savings - actual '
            '(kWh/year)"; planned twin: "Energy savings - planned (kWh/year)"]'
        ),
        compute=None,
        unavailable_reason=(
            "Too sparse to publish per country: the actual field is populated on 1 of "
            "~11k latest projects and sums to 0."
        ),
    ),
    Metric(
        metric_id="impact_technicians",
        label="Technicians trained",
        section="Impact",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.NOT_AVAILABLE,
        formula=(
            "sum(Projects sheet 'Total number of technicians trained - actual') over "
            "the country's projects"
        ),
        db_source="IMPACT-UNPOPULATED",
        src_model_field=(
            "Project.total_number_of_technicians_trained_actual  [export column: "
            '"Total number of technicians trained - actual"]'
        ),
        compute=None,
        unavailable_reason=(
            "Too sparse to publish per country: populated on 44 of ~11k latest "
            "projects across 18 countries."
        ),
    ),
    Metric(
        metric_id="impact_customs",
        label="Customs officers trained",
        section="Impact",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.NOT_AVAILABLE,
        formula=(
            "sum(Projects sheet 'Total number of customs officers trained - actual') "
            "over the country's projects"
        ),
        db_source="IMPACT-UNPOPULATED",
        src_model_field=(
            "Project.total_number_of_customs_officers_trained_actual  [export column: "
            '"Total number of customs officers trained - actual"]'
        ),
        compute=None,
        unavailable_reason=(
            "Too sparse to publish per country: populated on 41 of ~11k latest "
            "projects across 18 countries."
        ),
    ),
    Metric(
        metric_id="impact_enterprises",
        label="Enterprises assisted",
        section="Impact",
        kind=Kind.SCALAR,
        unit=Unit.COUNT,
        disposition=Disposition.NOT_AVAILABLE,
        formula=(
            "sum of the three 'directly funded' actual columns (SMEs + non-SMEs + "
            "both-not-directly-funded)"
        ),
        db_source="IMPACT-UNPOPULATED",
        src_model_field=(
            "Project.number_of_smes_directly_funded_actual + "
            "number_of_non_sme_directly_funded_actual + "
            "number_of_both_sme_non_sme_not_directly_funded_actual  [export columns: "
            '"Number of SMEs directly funded - actual", "Number of non-SMEs directly '
            'funded - actual", "Number of both SMEs and non-SMEs included in the '
            'project but not directly funded - actual"]'
        ),
        compute=None,
        unavailable_reason=(
            "Too sparse to publish per country: populated on 3 of ~11k latest "
            "projects across 2 countries."
        ),
    ),
    Metric(
        metric_id="impact_certification",
        label="Competence certification established",
        section="Impact",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country YES/NO",
        db_source="SOURCE-UNDECIDED",
        src_model_field="Project.establishment_of_technician_certification",
        compute=None,
        unavailable_reason=(
            "Only per-project Project.establishment_of_technician_certification "
            "exists; there is no country roll-up. Same blocker as attr_certification. "
            "Source undecided."
        ),
    ),
    Metric(
        metric_id="impact_meps",
        label="MEPS established",
        section="Impact",
        kind=Kind.SCALAR,
        unit=None,
        disposition=Disposition.NOT_AVAILABLE,
        formula="country ESTABLISHED",
        db_source="SOURCE-UNDECIDED",
        src_model_field="Project.meps_developed_domestic_refrigeration",
        compute=None,
        unavailable_reason=(
            "Only per-project Project.meps_developed_* exists; there is no country "
            "roll-up. Same blocker as attr_meps. Source undecided."
        ),
    ),
)

COUNTRY_METRICS_BY_ID = index_metrics(COUNTRY_METRICS, "COUNTRY_METRICS")
