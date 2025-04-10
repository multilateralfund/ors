from colorfield.fields import ColorField
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from core.models.agency import Agency
from core.models.blend import Blend

from core.models.country import Country
from core.models.meeting import Decision, Meeting
from core.models.rbm_measures import RBMMeasure
from core.models.substance import Substance
from core.models.utils import SubstancesType, get_protected_storage


ALL_TYPE_CODES = ["CPG", "DEM", "INS", "INV", "PRP", "TAS", "TRA", "DOC", "PS", "PHA"]

# project type code - project sector code
PROJECT_SECTOR_TO_TYPE_MAPPINGS = {
    "ARS": ALL_TYPE_CODES,
    "DES": ALL_TYPE_CODES,
    "FOA": ALL_TYPE_CODES,
    "FUM": ALL_TYPE_CODES,
    "FFI": ALL_TYPE_CODES,
    "PAG": ALL_TYPE_CODES,
    "PRO": ALL_TYPE_CODES,
    "REF": ALL_TYPE_CODES,
    "SOL": ALL_TYPE_CODES,
    "STE": ALL_TYPE_CODES,
    "SRV": ALL_TYPE_CODES,
    "PMU": ["TAS"],
    "AC": ALL_TYPE_CODES,
    "EMS": ALL_TYPE_CODES,
    "ELM": ALL_TYPE_CODES,
    "CAP": ALL_TYPE_CODES,
    "CU": ALL_TYPE_CODES,
    "PCAP": ALL_TYPE_CODES,
    "NOU": ALL_TYPE_CODES,
    "CA": ALL_TYPE_CODES,
    # this one is only present in the KM consolidated data v2 file
    "TAS": ["TAS"],
}


class MetaProject(models.Model):
    class MetaProjectType(models.TextChoices):
        MYA = "Multi-year agreement", "Multi-year agreement"
        IND = "Individual", "Individual"

    type = models.CharField(max_length=255, choices=MetaProjectType.choices)
    code = models.CharField(max_length=255, null=True, blank=True)
    pcr_project_id = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.type} {self.pcr_project_id}"


class ProjectTypeManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str)
        ).first()


class ProjectType(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    sort_order = models.FloatField(null=True, blank=True)

    objects = ProjectTypeManager()

    def __str__(self):
        return self.name

    @property
    def allowed_sectors(self):
        sector_codes = [
            sector
            for sector, types in PROJECT_SECTOR_TO_TYPE_MAPPINGS.items()
            if self.code in types
        ]
        return list(
            ProjectSector.objects.filter(code__in=sector_codes).values_list(
                "id", flat=True
            )
        )


class ProjectStatusManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str)
        ).first()


class ProjectStatus(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    color = ColorField(default="#CCCCCC")

    objects = ProjectStatusManager()

    class Meta:
        verbose_name_plural = "Project statuses"

    def __str__(self):
        return self.name


class ProjectSectorManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str)
        ).first()


class ProjectSector(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    sort_order = models.FloatField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        related_name="created_sectors",
        help_text="User who created the sector",
    )
    is_custom = models.BooleanField(
        default=False,
        help_text="Custom sector created by user, not from the official list.",
    )

    objects = ProjectSectorManager()

    def __str__(self):
        return self.name

    @property
    def allowed_types(self):
        type_codes = PROJECT_SECTOR_TO_TYPE_MAPPINGS.get(self.code, [])
        return list(
            ProjectType.objects.filter(code__in=type_codes).values_list("id", flat=True)
        )


class ProjectSubSectorManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str)
        ).first()

    def get_all_by_name_or_code(self, search_str):
        return self.filter(
            models.Q(name__icontains=search_str) | models.Q(code__icontains=search_str)
        ).all()

    def find_by_name_and_sector(self, name, sector_id):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str),
            sector_id=sector_id,
        ).first()


class ProjectSubSector(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    sector = models.ForeignKey(ProjectSector, on_delete=models.CASCADE)
    sort_order = models.FloatField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        related_name="created_subsectors",
        help_text="User who created the subsector",
    )
    is_custom = models.BooleanField(
        default=False,
        help_text="Custom sector created by user, not from the official list.",
    )

    objects = ProjectSubSectorManager()

    def __str__(self):
        return self.name


class ProjectClusterManager(models.Manager):
    def find_by_name_or_code(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str)
        ).first()


class ProjectCluster(models.Model):
    class ProjectClusterCategory(models.TextChoices):
        MYA = "MYA", "Multi-year agreement"
        IND = "IND", "Individual"
        BOTH = "BOTH", "Both"

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    category = models.CharField(
        max_length=255,
        choices=ProjectClusterCategory.choices,
        default=ProjectClusterCategory.BOTH,
    )
    sort_order = models.FloatField(null=True, blank=True)

    objects = ProjectClusterManager()

    def __str__(self):
        return self.name


class ProjectManager(models.Manager):
    def get_next_serial_number(self, country_id):
        return self.select_for_update().filter(country_id=country_id).count() + 1


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

    meta_project = models.ForeignKey(MetaProject, on_delete=models.CASCADE, null=True)
    bp_activity = models.ForeignKey(
        "BPActivity",
        on_delete=models.PROTECT,
        related_name="projects",
        null=True,
        blank=True,
    )

    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    national_agency = models.CharField(max_length=255, null=True, blank=True)
    coop_agencies = models.ManyToManyField(Agency, related_name="coop_projects")

    legacy_code = models.CharField(max_length=128, unique=True, null=True, blank=True)
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
    status = models.ForeignKey(ProjectStatus, on_delete=models.CASCADE)

    approval_meeting = models.ForeignKey(
        Meeting, on_delete=models.CASCADE, null=True, related_name="approved_projects"
    )
    meeting_transf = models.ForeignKey(
        Meeting,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="transferred_projects",
    )
    decision = models.ForeignKey(Decision, on_delete=models.CASCADE, null=True)
    project_duration = models.IntegerField(null=True, blank=True)
    stage = models.IntegerField(null=True, blank=True)
    tranche = models.TextField(null=True, blank=True)  # impact_tranche
    compliance = models.CharField(
        max_length=256, choices=ProjectCompliance.choices, null=True, blank=True
    )

    sector = models.ForeignKey(
        ProjectSector, on_delete=models.CASCADE, null=True, blank=True
    )
    sector_legacy = models.CharField(max_length=256, null=True, blank=True)
    subsector = models.ForeignKey(
        ProjectSubSector, on_delete=models.CASCADE, null=True, blank=True
    )
    subsector_legacy = models.CharField(max_length=256, null=True, blank=True)
    mya_subsector = models.CharField(max_length=256, null=True, blank=True)

    substance_type = models.CharField(max_length=256, choices=SubstancesType.choices)

    impact = models.FloatField(null=True, blank=True)
    impact_production = models.FloatField(null=True, blank=True)
    substance_phasedout = models.FloatField(null=True, blank=True)  # ods_phasedout

    fund_disbursed = models.FloatField(null=True, blank=True)
    fund_disbursed_psc = models.FloatField(null=True, blank=True)  # fund_disbursed_13
    capital_cost = models.FloatField(null=True, blank=True)
    operating_cost = models.FloatField(null=True, blank=True)
    contingency_cost = models.FloatField(null=True, blank=True)
    effectiveness_cost = models.FloatField(null=True, blank=True)
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
        max_length=164, choices=SubmissionCategory.choices, null=True
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

    objects = ProjectManager()

    def __str__(self):
        return self.title

    @property
    def latest_file(self):
        try:
            return self.files.latest()
        except ProjectFile.DoesNotExist:
            return None


class ProjectFile(models.Model):
    file = models.FileField(
        storage=get_protected_storage,
        upload_to="project_files/",
    )
    project = models.ForeignKey(
        "core.Project", on_delete=models.CASCADE, related_name="files"
    )
    date_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        get_latest_by = "date_created"


class ProjectOdsOdp(models.Model):
    class ProjectOdsOdpType(models.TextChoices):
        GENERAL = "general", "General"
        PRODUCTION = "production", "Production"
        INDIRECT = "indirect", "Indirect"

    ods_substance = models.ForeignKey(
        Substance,
        on_delete=models.CASCADE,
        related_name="project_ods",
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
    odp = models.FloatField(null=True, blank=True)
    ods_replacement = models.CharField(max_length=256, null=True, blank=True)
    co2_mt = models.FloatField(null=True, blank=True)
    ods_type = models.CharField(
        max_length=256,
        choices=ProjectOdsOdpType.choices,
        default=ProjectOdsOdpType.GENERAL,
    )
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="ods_odp"
    )
    sort_order = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return_str = self.ods_display_name
        if self.ods_replacement:
            return_str += " replacement: " + self.ods_replacement
        return return_str


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
        RBMMeasure, on_delete=models.CASCADE, related_name="project_measures"
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
