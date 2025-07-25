import os

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models, transaction

from core.models.agency import Agency
from core.models.blend import Blend

from core.models.country import Country
from core.models.meeting import Decision, Meeting
from core.models.rbm_measures import RBMMeasure
from core.models.project_metadata import (
    ProjectCluster,
    ProjectSector,
    ProjectStatus,
    ProjectSubmissionStatus,
    ProjectSubSector,
    ProjectType,
)
from core.models.substance import Substance
from core.models.utils import SubstancesType, get_protected_storage

# pylint: disable=C0302


class MetaProject(models.Model):
    class MetaProjectType(models.TextChoices):
        MYA = "Multi-year agreement", "Multi-year agreement"
        IND = "Individual", "Individual"

    lead_agency = models.ForeignKey(
        Agency, on_delete=models.PROTECT, null=True, blank=True
    )
    type = models.CharField(max_length=255, choices=MetaProjectType.choices)
    code = models.CharField(max_length=255, null=True, blank=True)
    new_code = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="""
        New code generated for the metaproject. The code will include all clusters,
        unlike the old code which allows only one.
        Format: country_code/cluster_code1/cluster_code2/.../serial_number
        """,
    )
    pcr_project_id = models.CharField(max_length=255, null=True, blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.type} {self.pcr_project_id}"


class ProjectManager(models.Manager):
    def get_next_serial_number(self, country_id):
        return self.select_for_update().filter(country_id=country_id).count() + 1

    def get_queryset(self):
        # by default, get projects that don't have latest_project set
        # i.e. the latest versions of the projects
        return super().get_queryset().filter(latest_project=None)

    def really_all(self):
        # this method is used to get all projects, including the archived ones
        return super().get_queryset()


class ProjectComponents(models.Model):
    """
    Used as an umbrella for all projects that are components to each other.
    """

    def __str__(self):
        projects = Project.objects.really_all().filter(component=self)
        return f"{[x.id for x in projects]}"


class Project(models.Model):
    class SubmissionCategory(models.TextChoices):
        BIL_COOP = (
            "bilateral cooperation",
            "Bilateral cooperation",
        )
        INVEST_PROJ = (
            "investment project",
            "Investment project",
        )
        WORK_PROG_AMMEND = (
            "work programme amendment",
            "Work programme amendment",
        )
        OTHER_DOC = (
            "other doc: cpg, policy paper, business plan",
            "Other doc: CPG, policy paper, business plan",
        )

    class ProjectCompliance(models.TextChoices):
        EE = "Energy Efficieny", "Energy Efficieny"
        NONEE = "Non-Energey Efficiency", "Non-Energey Efficiency"

    class DestructionTechnology(models.TextChoices):
        DT1 = "D1", "D1"
        DT2 = "D2", "D2"

    class ProductionControlType(models.TextChoices):
        REDUCTION = "reduction", "Reduction"
        CLOSURE = "closure", "Closure"
        SWITCH_TO_PRODUCTION_FOR_FEEDSTOCK_USES = (
            "switch_to_production_for_feedstock_uses",
            "Switch to production for feedstock uses",
        )
        CONVERSION_TO_NON_CONTROLLED_SUBSTANCE = (
            "conversion_to_non_controlled_substance",
            "Conversion to non-controlled substance",
        )

    class Regulations(models.TextChoices):
        PR1 = "pr1", "PR1"
        PR2 = "pr2", "PR2"
        PR3 = "pr3", "PR3"

    meta_project = models.ForeignKey(
        MetaProject, on_delete=models.CASCADE, related_name="projects", null=True
    )
    component = models.ForeignKey(
        ProjectComponents,
        on_delete=models.DO_NOTHING,
        related_name="projects",
        null=True,
        blank=True,
    )
    production = models.BooleanField(
        default=False,
        help_text="If the project is a production project, it will be used for production analysis",
    )

    bp_activity = models.ForeignKey(
        "BPActivity",
        on_delete=models.SET_NULL,
        related_name="projects",
        null=True,
        blank=True,
    )
    bp_activity_json = models.JSONField(blank=True, null=True)

    latest_project = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="archive_projects",
        help_text="If this is an archive project, this field will be set to the latest project",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    version_created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        default=None,
        related_name="created_projects_version",
        help_text="User who created this project version",
    )
    version = models.FloatField(default=1)

    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    lead_agency_submitting_on_behalf = models.BooleanField(
        default=False,
        help_text="True if the user is the lead agency submitting on behalf of a cooperating agency.",
    )
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    national_agency = models.CharField(max_length=255, null=True, blank=True)
    coop_agencies = models.ManyToManyField(
        Agency, related_name="coop_projects", blank=True
    )

    legacy_code = models.CharField(max_length=128, null=True, blank=True)

    code = models.CharField(max_length=128, null=True, blank=True)
    serial_number_legacy = models.IntegerField(null=True, blank=True)  # number
    serial_number = models.IntegerField(null=True, blank=True)
    additional_funding = models.BooleanField(default=False)
    mya_code = models.CharField(max_length=128, null=True, blank=True)
    title = models.CharField(max_length=256)
    description = models.TextField(null=True, blank=True)
    excom_provision = models.TextField(null=True, blank=True)
    project_type = models.ForeignKey(ProjectType, on_delete=models.CASCADE)
    project_type_legacy = models.CharField(max_length=256, null=True, blank=True)
    cluster = models.ForeignKey(
        ProjectCluster, on_delete=models.CASCADE, null=True, blank=True
    )
    submission_status = models.ForeignKey(
        ProjectSubmissionStatus, on_delete=models.CASCADE
    )
    status = models.ForeignKey(ProjectStatus, on_delete=models.CASCADE)
    meeting = models.ForeignKey(
        Meeting, on_delete=models.CASCADE, related_name="projects"
    )
    meeting_transf = models.ForeignKey(
        Meeting,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="transferred_projects",
    )
    decision = models.ForeignKey(
        Decision, on_delete=models.CASCADE, null=True, blank=True
    )
    project_duration = models.IntegerField(null=True, blank=True)
    stage = models.IntegerField(null=True, blank=True)
    tranche = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
    )
    compliance = models.CharField(
        max_length=256, choices=ProjectCompliance.choices, null=True, blank=True
    )

    sector = models.ForeignKey(
        ProjectSector, on_delete=models.CASCADE, null=True, blank=True
    )
    sector_legacy = models.CharField(max_length=256, null=True, blank=True)
    subsectors = models.ManyToManyField(
        ProjectSubSector, related_name="projects", blank=True
    )
    subsector_legacy = models.CharField(max_length=256, null=True, blank=True)
    mya_subsector = models.CharField(max_length=256, null=True, blank=True)

    substance_type = models.CharField(
        max_length=256, choices=SubstancesType.choices, null=True, blank=True
    )

    impact = models.FloatField(null=True, blank=True)
    impact_production = models.FloatField(null=True, blank=True)
    substance_phasedout = models.FloatField(null=True, blank=True)  # ods_phasedout

    fund_disbursed = models.FloatField(null=True, blank=True)
    fund_disbursed_psc = models.FloatField(null=True, blank=True)  # fund_disbursed_13
    capital_cost = models.FloatField(null=True, blank=True)
    operating_cost = models.FloatField(null=True, blank=True)
    contingency_cost = models.FloatField(null=True, blank=True)
    effectiveness_cost = models.FloatField(null=True, blank=True)
    total_fund = models.FloatField(null=True, blank=True)
    total_fund_transferred = models.FloatField(null=True, blank=True)
    total_psc_transferred = models.FloatField(null=True, blank=True)
    total_fund_approved = models.FloatField(null=True, blank=True)
    total_psc_cost = models.FloatField(null=True, blank=True)
    total_grant = models.FloatField(null=True, blank=True)

    date_approved = models.DateField(null=True, blank=True)
    date_completion = models.DateField(null=True, blank=True)
    date_actual = models.DateField(null=True, blank=True)
    date_per_agreement = models.DateField(null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)

    # other fields
    umbrella_project = models.BooleanField(default=False)
    loan = models.BooleanField(default=False)
    intersessional_approval = models.BooleanField(default=False)
    retroactive_finance = models.BooleanField(default=False)
    withdrawn = models.BooleanField(default=False)
    incomplete = models.BooleanField(default=False)
    issue = models.BooleanField(default=False)
    issue_description = models.TextField(null=True, blank=True)
    application = models.CharField(max_length=256, null=True, blank=True)
    products_manufactured = models.TextField(null=True, blank=True)
    plan = models.TextField(null=True, blank=True)
    technology = models.CharField(max_length=256, null=True, blank=True)
    impact_co2mt = models.FloatField(null=True, blank=True)
    impact_prod_co2mt = models.FloatField(null=True, blank=True)
    ods_phasedout_co2mt = models.FloatField(null=True, blank=True)
    hcfc_stage = models.FloatField(null=True, blank=True)
    date_comp_revised = models.DateField(null=True, blank=True)
    date_per_decision = models.DateField(null=True, blank=True)
    local_ownership = models.FloatField(null=True, blank=True)
    export_to = models.FloatField(null=True, blank=True)
    submission_category = models.CharField(
        max_length=164, choices=SubmissionCategory.choices, null=True, blank=True
    )
    submission_number = models.IntegerField(null=True, blank=True)
    programme_officer = models.CharField(max_length=255, null=True, blank=True)
    funds_allocated = models.FloatField(null=True, blank=True)
    support_cost_psc = models.FloatField(null=True, blank=True)
    project_cost = models.FloatField(null=True, blank=True)
    date_received = models.DateField(null=True, blank=True)
    revision_number = models.TextField(null=True, blank=True)
    date_of_revision = models.DateField(null=True, blank=True)
    agency_remarks = models.TextField(null=True, blank=True)
    submission_comments = models.TextField(null=True, blank=True)  # comments
    reviewed_mfs = models.BooleanField(default=False)
    correspondance_no = models.IntegerField(null=True, blank=True)
    plus = models.BooleanField(default=False)
    source_file = models.CharField(max_length=255, null=True, blank=True)

    # new fields
    is_lvc = models.BooleanField(
        help_text="The field to be derived but with the option change the value for the KIP (As an example).",
        null=True,
        blank=True,
    )
    individual_consideration = models.BooleanField(
        null=True,
        blank=True,
        help_text="""
            Blanket or Individual consideration.
            This field is needed for analyses at the recommendation stage for QA unit.
            And it is for MLFS users to select at the review stage.
        """,
    )
    project_start_date = models.DateField(null=True, blank=True)
    project_end_date = models.DateField(null=True, blank=True)
    group = models.ForeignKey(
        "core.Group",
        on_delete=models.CASCADE,
        related_name="projects",
        null=True,
        blank=True,
        help_text="Annex group of substances",
    )
    destruction_technology = models.CharField(
        max_length=256, choices=DestructionTechnology.choices, null=True, blank=True
    )

    production_control_type = models.CharField(
        max_length=256,
        choices=ProductionControlType.choices,
        null=True,
        blank=True,
    )
    is_sme = models.BooleanField(null=True, blank=True)

    # new MYA fields
    mya_start_date = models.DateField(
        null=True, blank=True, help_text="Start date (MYA)"
    )
    mya_end_date = models.DateField(null=True, blank=True, help_text="End date (MYA)")
    mya_project_funding = models.FloatField(
        null=True, blank=True, help_text="Project Funding (MYA)"
    )
    mya_support_cost = models.FloatField(
        null=True, blank=True, help_text="Support Cost (MYA)"
    )
    number_of_enterprises = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of enterprises (MYA)",
    )
    aggregated_consumption = models.FloatField(
        null=True,
        blank=True,
        help_text="The field is the aggregated consumption of all enterprises",
    )
    targets = models.FloatField(
        null=True,
        blank=True,
        help_text="Targets for the MYA project. The field is the aggregated consumption of all enterprises",
    )
    starting_point = models.FloatField(null=True, blank=True)
    baseline = models.FloatField(null=True, blank=True)
    mya_phase_out_co2_eq_t = models.FloatField(
        null=True, blank=True, help_text="Phase out (CO2-eq t) (MYA)"
    )
    mya_phase_out_odp_t = models.FloatField(
        null=True, blank=True, help_text="Phase out (ODP t) (MYA)"
    )
    mya_phase_out_mt = models.FloatField(
        null=True, blank=True, help_text="Phase out (Mt) (MYA)"
    )
    cost_effectiveness = models.FloatField(
        null=True,
        blank=True,
        help_text="Cost effectiveness (US$/ Kg) (MYA)",
    )
    cost_effectiveness_co2 = models.FloatField(
        null=True,
        blank=True,
        help_text="Cost effectiveness (US$/ CO2-eq) (MYA)",
    )
    number_of_production_lines_assisted = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of production lines assisted (MYA)",
    )

    # new approval fields
    funding_window = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Funding window",
    )
    ad_hoc_pcr = models.BooleanField(
        null=True,
        blank=True,
        help_text="Ad-hoc PCR",
    )
    pcr_waived = models.BooleanField(
        null=True,
        blank=True,
        help_text="PCR waived",
    )

    # impact indicators (old RBM measures)
    total_number_of_technicians_trained = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total number of technicians trained (planned)",
    )
    total_number_of_technicians_trained_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total number of technicians trained (actual)",
    )
    number_of_female_technicians_trained = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of female technicians trained (planned)",
    )
    number_of_female_technicians_trained_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of female technicians trained (actual)",
    )
    total_number_of_trainers_trained = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total number of trainers trained (planned)",
    )
    total_number_of_trainers_trained_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total number of trainers trained (actual)",
    )
    number_of_female_trainers_trained = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of female trainers trained (planned)",
    )
    number_of_female_trainers_trained_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of female trainers trained (actual)",
    )
    total_number_of_technicians_certified = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total number of technicians certified (planned)",
    )
    total_number_of_technicians_certified_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total number of technicians certified (actual)",
    )
    number_of_female_technicians_certified = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of female technicians certified (planned)",
    )
    number_of_female_technicians_certified_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of female technicians certified (actual)",
    )
    number_of_training_institutions_newly_assisted = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of training institutions newly assisted (planned)",
    )
    number_of_training_institutions_newly_assisted_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of training institutions newly assisted (actual)",
    )
    number_of_tools_sets_distributed = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of tools sets distributed (planned)",
    )
    number_of_tools_sets_distributed_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of tools sets distributed (actual)",
    )
    total_number_of_customs_officers_trained = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total number of customs officers trained (planned)",
    )
    total_number_of_customs_officers_trained_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total number of customs officers trained (actual)",
    )
    number_of_female_customs_officers_trained = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of female customs officers trained (planned)",
    )
    number_of_female_customs_officers_trained_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of female customs officers trained (actual)",
    )
    total_number_of_nou_personnel_supported = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total number of NOU personnel supported (planned)",
    )
    total_number_of_nou_personnel_supported_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total number of NOU personnel supported (actual)",
    )
    number_of_female_nou_personnel_supported = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of female NOU personnel supported (planned)",
    )
    number_of_female_nou_personnel_supported_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of female NOU personnel supported (actual)",
    )
    number_of_enterprises_assisted = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of enterprises assisted (planned)",
    )
    number_of_enterprises_assisted_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of enterprises assisted (actual)",
    )
    certification_system_for_technicians = models.BooleanField(
        null=True,
        blank=True,
        help_text="Certification system for technicians established or further enhanced (planned)",
    )
    certification_system_for_technicians_actual = models.BooleanField(
        null=True,
        blank=True,
        help_text="Certification system for technicians established or further enhanced (actual)",
    )
    operation_of_recovery_and_recycling_scheme = models.BooleanField(
        null=True,
        blank=True,
        help_text="Operation of recovery and recycling scheme (planned)",
    )
    operation_of_recovery_and_recycling_scheme_actual = models.BooleanField(
        null=True,
        blank=True,
        help_text="Operation of recovery and recycling scheme (actual)",
    )
    operation_of_reclamation_scheme = models.BooleanField(
        null=True,
        blank=True,
        help_text="Operation of reclamation scheme (planned)",
    )
    operation_of_reclamation_scheme_actual = models.BooleanField(
        null=True,
        blank=True,
        help_text="Operation of reclamation scheme (actual)",
    )
    establishment_of_imp_exp_licensing = models.BooleanField(
        null=True,
        blank=True,
        help_text="Establishment or upgrade of import/export licensing (planned)",
    )
    establishment_of_imp_exp_licensing_actual = models.BooleanField(
        null=True,
        blank=True,
        help_text="Establishment or upgrade of import/export licensing (actual)",
    )
    establishment_of_quota_systems = models.BooleanField(
        null=True,
        blank=True,
        help_text="Establishment of quota systems (planned)",
    )
    establishment_of_quota_systems_actual = models.BooleanField(
        null=True,
        blank=True,
        help_text="Establishment of quota systems (actual)",
    )
    ban_of_equipment = models.IntegerField(
        null=True,
        blank=True,
        help_text="Ban of equipment (planned)",
    )
    ban_of_equipment_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Ban of equipment (actual)",
    )
    ban_of_substances = models.IntegerField(
        null=True,
        blank=True,
        help_text="Ban of substances (planned)",
    )
    ban_of_substances_actual = models.IntegerField(
        null=True,
        blank=True,
        help_text="Ban of substances (actual)",
    )
    kwh_year_saved = models.FloatField(
        null=True,
        blank=True,
        help_text="kWh/year saved (planned)",
    )
    kwh_year_saved_actual = models.FloatField(
        null=True,
        blank=True,
        help_text="kWh/year saved (actual)",
    )
    meps_developed_domestic_refrigeration = models.BooleanField(
        null=True,
        blank=True,
        help_text="MEPS developed for domestic refrigeration (planned)",
    )
    meps_developed_domestic_refrigeration_actual = models.BooleanField(
        null=True,
        blank=True,
        help_text="MEPS developed for domestic refrigeration (actual)",
    )
    meps_developed_commercial_refrigeration = models.BooleanField(
        null=True,
        blank=True,
        help_text="MEPS developed for commercial refrigeration (planned)",
    )
    meps_developed_commercial_refrigeration_actual = models.BooleanField(
        null=True,
        blank=True,
        help_text="MEPS developed for commercial refrigeration (actual)",
    )
    meps_developed_residential_ac = models.BooleanField(
        null=True,
        blank=True,
        help_text="MEPS developed for residential air-conditioning (planned)",
    )
    meps_developed_residential_ac_actual = models.BooleanField(
        null=True,
        blank=True,
        help_text="MEPS developed for residential air-conditioning (actual)",
    )
    meps_developed_commercial_ac = models.BooleanField(
        null=True,
        blank=True,
        help_text="MEPS developed for commercial AC (planned)",
    )
    meps_developed_commercial_ac_actual = models.BooleanField(
        null=True,
        blank=True,
        help_text="MEPS developed for commercial AC (actual)",
    )
    capacity_building_programmes = models.BooleanField(
        null=True,
        blank=True,
        help_text="""
            Capacity building programmes for technicians, end-users, operators,
            consultants, procurement officers and other Government entities (planned)",
        """,
    )
    capacity_building_programmes_actual = models.BooleanField(
        null=True,
        blank=True,
        help_text="""
            Capacity building programmes for technicians, end-users, operators,
            consultants, procurement officers and other Government entities (actual)",
        """,
    )
    ee_demonstration_project = models.BooleanField(
        null=True,
        blank=True,
        help_text="EE demonstration project included (planned)",
    )
    ee_demonstration_project_actual = models.BooleanField(
        null=True,
        blank=True,
        help_text="EE demonstration project included (actual)",
    )
    quantity_controlled_substances_destroyed_mt = models.FloatField(
        null=True,
        blank=True,
        help_text="Quantity of controlled substances destroyed (Metric tonnes) (planned)",
    )
    quantity_controlled_substances_destroyed_mt_actual = models.FloatField(
        null=True,
        blank=True,
        help_text="Quantity of controlled substances destroyed (Metric tonnes) (actual)",
    )
    quantity_controlled_substances_destroyed_co2_eq_t = models.FloatField(
        null=True,
        blank=True,
        help_text="Quantity of controlled substances destroyed (CO2-eq tonnes) (planned)",
    )
    quantity_controlled_substances_destroyed_co2_eq_t_actual = models.FloatField(
        null=True,
        blank=True,
        help_text="Quantity of controlled substances destroyed (CO2-eq tonnes) (actual)",
    )
    checklist_regulations = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        choices=Regulations.choices,
        help_text="Checklist of regulations or policies enacted (planned)",
    )
    checklist_regulations_actual = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        choices=Regulations.choices,
        help_text="Checklist of regulations or policies enacted (actual)",
    )
    quantity_hfc_23_by_product_generated = models.FloatField(
        null=True,
        blank=True,
        help_text="Quantity of HFC-23 by-product (Generated) (planned)",
    )
    quantity_hfc_23_by_product_generated_actual = models.FloatField(
        null=True,
        blank=True,
        help_text="Quantity of HFC-23 by-product (Generated) (actual)",
    )
    quantity_hfc_23_by_product_generation_rate = models.FloatField(
        null=True,
        blank=True,
        help_text="Quantity of HFC-23 by-product (by product generation rate) (planned)",
    )
    quantity_hfc_23_by_product_generation_rate_actual = models.FloatField(
        null=True,
        blank=True,
        help_text="Quantity of HFC-23 by-product (by product generation rate) (actual)",
    )
    quantity_hfc_23_by_product_destroyed = models.FloatField(
        null=True,
        blank=True,
        help_text="Quantity of HFC-23 by-product (Destroyed) (planned)",
    )
    quantity_hfc_23_by_product_destroyed_actual = models.FloatField(
        null=True,
        blank=True,
        help_text="Quantity of HFC-23 by-product (Destroyed) (actual)",
    )
    quantity_hfc_23_by_product_emitted = models.FloatField(
        null=True,
        blank=True,
        help_text="Quantity of HFC-23 by-product (Emitted) (planned)",
    )
    quantity_hfc_23_by_product_emitted_actual = models.FloatField(
        null=True,
        blank=True,
        help_text="Quantity of HFC-23 by-product (Emitted) (actual)",
    )

    objects = ProjectManager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["legacy_code"],
                condition=models.Q(latest_project__isnull=True),
                name="unique_legacy_code_when_latest_project_is_none",
            )
        ]
        ordering = ["-date_actual", "country__name", "serial_number"]

    def increase_version(self, user):
        def _get_new_file_path(original_file_name, new_project_id):
            # Generate a new file path for the duplicated file
            base_dir, file_name = os.path.split(original_file_name)
            new_file_name = f"{file_name}_{new_project_id}"
            return os.path.join(base_dir, new_file_name)

        with transaction.atomic():
            # Duplicate the project
            old_project = Project.objects.get(pk=self.pk)
            old_project.pk = None
            old_project.latest_project = self

            old_project.save()

            self.version += 1
            self.version_created_by = user
            self.save()

            # Duplicate the linked ProjectOdsOdp entries
            ods_odp_entries = ProjectOdsOdp.objects.filter(project=self)
            for entry in ods_odp_entries:
                entry.pk = None
                entry.project = old_project
                entry.save()

            # Duplicate the linked ProjectFund entries
            fund_entries = ProjectFund.objects.filter(project=self)
            for entry in fund_entries:
                entry.pk = None
                entry.project = old_project
                entry.save()

            # Duplicate the linked ProjectRBMMeasure entries
            rbm_entries = ProjectRBMMeasure.objects.filter(project=self)
            for entry in rbm_entries:
                entry.pk = None
                entry.project = old_project
                entry.save()

            # Duplicate the linked ProjectProgressReport entries
            progress_report_entries = ProjectProgressReport.objects.filter(project=self)
            for entry in progress_report_entries:
                entry.pk = None
                entry.project = old_project
                entry.save()

            # Duplicate the linked SubmissionAmount entries
            submission_amount_entries = SubmissionAmount.objects.filter(project=self)
            for entry in submission_amount_entries:
                entry.pk = None
                entry.project = old_project
                entry.save()

            # Duplicate the ProjectComment entries
            comment_entries = ProjectComment.objects.filter(project=self)
            for entry in comment_entries:
                entry.pk = None
                entry.project = old_project
                entry.save()

            # Transfer files to the archive project
            ProjectFile.objects.filter(project=self).update(project=old_project)

    def __str__(self):
        return self.title

    @property
    def latest_file(self):
        files = list(self.files.all())
        if not files:
            return None
        files.sort(key=lambda f: f.date_created, reverse=True)
        return files[0]


class ProjectFile(models.Model):
    file = models.FileField(
        storage=get_protected_storage,
        upload_to="project_files/",
    )
    project = models.ForeignKey(
        "core.Project", on_delete=models.CASCADE, related_name="files"
    )
    filename = models.CharField(max_length=100)
    date_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        get_latest_by = "date_created"


class ProjectOdsOdp(models.Model):
    class ProjectOdsOdpType(models.TextChoices):
        GENERAL = "general", "General"
        PRODUCTION = "production", "Production"
        INDIRECT = "indirect", "Indirect"
        OTHER = "other", "Other type"

    ods_substance = models.ForeignKey(
        Substance,
        on_delete=models.CASCADE,
        related_name="project_ods",
        help_text="Substance - baseline technology",
        null=True,
        blank=True,
    )
    ods_blend = models.ForeignKey(
        Blend,
        on_delete=models.CASCADE,
        related_name="project_ods",
        null=True,
        blank=True,
    )

    ods_display_name = models.CharField(max_length=256, null=True, blank=True)
    ods_replacement = models.CharField(
        max_length=256, null=True, blank=True, help_text="Replacement technology/ies"
    )
    co2_mt = models.FloatField(null=True, blank=True, help_text="Phase out (CO2-eq t)")
    odp = models.FloatField(null=True, blank=True, help_text="Phase out (ODP t)")
    phase_out_mt = models.FloatField(null=True, blank=True, help_text="Phase out (Mt)")

    ods_type = models.CharField(
        max_length=256,
        choices=ProjectOdsOdpType.choices,
        null=True,
        blank=True,
    )
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="ods_odp"
    )
    sort_order = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return_str = self.ods_display_name or ""
        if self.ods_replacement:
            return_str = f"{return_str} replacement: {self.ods_replacement}"
        return return_str

    def get_ods_display_name(self, obj):
        if obj.ods_display_name:
            return obj.ods_display_name
        if obj.ods_substance:
            return obj.ods_substance.name
        if obj.ods_blend:
            return obj.ods_blend.name
        return None


class ProjectFund(models.Model):
    class FundType(models.TextChoices):
        ALLOCATED = "allocated", "Allocated"
        TRANSFERRED = "transferred", "Transferred"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="funds")
    amount = models.FloatField()
    support_psc = models.FloatField(default=0, null=True)  # support_13
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, null=True)
    interest = models.FloatField(default=0, null=True)
    date = models.DateField(null=True, blank=True)
    fund_type = models.CharField(max_length=256, choices=FundType.choices)
    sort_order = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.project.title} {self.amount} {self.date}"


class SubmissionAmount(models.Model):
    class SubmissionStatus(models.TextChoices):
        REQUESTED = "requested", "Requested"
        REVIEWED = "reviewed", "Reviewed"
        RECOMMENDED = "recomm", "Recommended"
        GRAND_TOTAL = "grand_total", "Grand Total"
        RSVD = "rsvd", "Grand Total RSVD"

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="submission_amounts"
    )
    amount = models.FloatField()
    amount_psc = models.FloatField(default=0, null=True)  # amount_13
    impact = models.FloatField(default=0, null=True)
    cost_effectiveness = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=164, choices=SubmissionStatus.choices)

    def __str__(self):
        return f"{self.amount} {self.status}"


class ProjectRBMMeasure(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="rbm_measures"
    )
    measure = models.ForeignKey(
        RBMMeasure,
        on_delete=models.CASCADE,
        related_name="project_measures",
        help_text="Results-Based Management measure to be used for this project",
    )
    value = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.project.title} {self.measure.name}"


class ProjectProgressReport(models.Model):
    source_file = models.CharField(max_length=255, null=True, blank=True)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="progress_reports"
    )
    status = models.ForeignKey(
        ProjectStatus, on_delete=models.CASCADE, related_name="+"
    )
    latest_status = models.ForeignKey(
        ProjectStatus, on_delete=models.CASCADE, related_name="+"
    )
    meeting_of_report = models.CharField(max_length=255, null=True, blank=True)
    category = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="multi-year/one-off phaseout/individual/rmp/rmp update",
    )
    assessment_of_progress = models.TextField(null=True, blank=True)
    latest_progress = models.CharField(max_length=255, null=True, blank=True)
    mtg = models.PositiveIntegerField(null=True, blank=True)
    num = models.PositiveIntegerField(null=True, blank=True)
    a_n = models.CharField(max_length=1, null=True, blank=True)
    o_t = models.CharField(max_length=1, null=True, blank=True)
    irdx = models.CharField(max_length=1, null=True, blank=True)
    chemical = models.CharField(max_length=100, null=True, blank=True)
    consumption_odp_out_proposal = models.FloatField(null=True, blank=True)
    consumption_odp_out_actual = models.FloatField(null=True, blank=True)
    production_odp_out_proposal = models.FloatField(null=True, blank=True)
    production_odp_out_actual = models.FloatField(null=True, blank=True)
    date_approved = models.DateField(null=True, blank=True)
    date_first_disbursement = models.DateField(null=True, blank=True)
    date_comp_proposal = models.DateField(null=True, blank=True)
    date_comp_plan = models.DateField(null=True, blank=True)
    date_comp_actual = models.DateField(null=True, blank=True)
    date_comp_financial = models.DateField(null=True, blank=True)
    funds_approved = models.FloatField(null=True, blank=True)
    funds_adjustment = models.FloatField(null=True, blank=True)
    funds_net = models.FloatField(null=True, blank=True)
    funds_disbursed = models.FloatField(null=True, blank=True)
    percent_disbursed = models.FloatField(null=True, blank=True)
    balance = models.FloatField(null=True, blank=True)
    funds_obligated = models.FloatField(null=True, blank=True)
    funds_current_year = models.FloatField(null=True, blank=True)
    support_approved = models.FloatField(null=True, blank=True)
    support_adjustment = models.FloatField(null=True, blank=True)
    support_disbursed = models.FloatField(null=True, blank=True)
    support_balance = models.FloatField(null=True, blank=True)
    support_obligated = models.FloatField(null=True, blank=True)
    support_returned = models.FloatField(null=True, blank=True)
    year_approved = models.PositiveIntegerField(
        null=True, blank=True, validators=[MinValueValidator(settings.MIN_VALID_YEAR)]
    )
    year_of_contribution = models.PositiveIntegerField(
        null=True, blank=True, validators=[MinValueValidator(settings.MIN_VALID_YEAR)]
    )
    months_first_disbursement = models.IntegerField(null=True, blank=True)
    months_comp_proposal = models.IntegerField(null=True, blank=True)
    months_comp_plan = models.IntegerField(null=True, blank=True)
    months_comp_actual = models.IntegerField(null=True, blank=True)
    remarks_1 = models.TextField(null=True, blank=True)
    remarks_2 = models.TextField(null=True, blank=True)
    date_comp_plan_22 = models.DateField(null=True, blank=True)
    date_comp_plan_28 = models.DateField(null=True, blank=True)
    date_comp_plan_31 = models.DateField(null=True, blank=True)
    date_comp_plan_34 = models.DateField(null=True, blank=True)
    date_comp_plan_37 = models.DateField(null=True, blank=True)
    date_comp_plan_40 = models.DateField(null=True, blank=True)
    date_comp_plan_43 = models.DateField(null=True, blank=True)
    date_comp_plan_46 = models.DateField(null=True, blank=True)
    date_comp_plan_52 = models.DateField(null=True, blank=True)
    latest_planned_date = models.DateField(null=True, blank=True)
    BP_year = models.CharField(max_length=255, null=True, blank=True)
    BP_allocation = models.CharField(max_length=100, null=True, blank=True)
    disbursements_to_final = models.FloatField(
        null=True,
        blank=True,
        help_text="Disbursements made to final beneficiaries from FECO/ MEP",
    )
    MY_consumption_performance_target = models.FloatField(null=True, blank=True)
    MY_actual_consumption = models.FloatField(null=True, blank=True)
    MY_production_performance_target = models.FloatField(null=True, blank=True)
    MY_actual_production = models.FloatField(null=True, blank=True)
    MY_annual_target_met = models.CharField(max_length=255, null=True, blank=True)
    MY_verification_completed = models.CharField(max_length=255, null=True, blank=True)
    MY_verification_report = models.CharField(max_length=255, null=True, blank=True)


class ProjectComment(models.Model):
    source_file = models.CharField(max_length=255, null=True, blank=True)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="comments"
    )
    meeting_of_report = models.ForeignKey(
        Meeting, on_delete=models.CASCADE, null=True, blank=True
    )
    meeting_of_report_string = models.CharField(max_length=255, null=True, blank=True)
    secretariat_comment = models.TextField(
        null=True, blank=True, verbose_name="Secretariat's Comment"
    )
    agency_response = models.TextField(
        null=True, blank=True, verbose_name="Agency's Response"
    )
