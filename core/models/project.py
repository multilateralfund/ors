from colorfield.fields import ColorField
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.core.validators import MinValueValidator
from django.db import models

from core.models.agency import Agency
from core.models.blend import Blend

from core.models.country import Country
from core.models.substance import Substance

PROTECTED_STORAGE = FileSystemStorage(location=settings.PROTECTED_MEDIA_ROOT)


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

    objects = ProjectSectorManager()

    def __str__(self):
        return self.name


class ProjectSubSectorManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str)
        ).first()

    def find_by_name_and_sector(self, name, sector):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str),
            sector=sector,
        ).first()


class ProjectSubSector(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    sector = models.ForeignKey(ProjectSector, on_delete=models.CASCADE)
    sort_order = models.FloatField(null=True, blank=True)

    objects = ProjectSubSectorManager()

    def __str__(self):
        return self.name


class Project(models.Model):
    class SubstancesType(models.TextChoices):
        HCFC = "HCFC", "HCFC"
        HFC = "HFC", "HFC"
        HFC_Plus = "HFC_Plus", "HFC_Plus"

    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    national_agency = models.CharField(max_length=255, null=True, blank=True)
    coop_agencies = models.ManyToManyField(Agency, related_name="coop_projects")
    number = models.IntegerField(null=True, blank=True)
    code = models.CharField(max_length=128, unique=True, null=True, blank=True)
    mya_code = models.CharField(max_length=128, null=True, blank=True)
    approval_meeting_no = models.IntegerField(null=True, blank=True)
    project_type = models.ForeignKey(ProjectType, on_delete=models.CASCADE)
    multi_year = models.BooleanField(default=False)
    project_duration = models.IntegerField(null=True, blank=True)
    stage = models.IntegerField(null=True, blank=True)
    subsector = models.ForeignKey(ProjectSubSector, on_delete=models.CASCADE)
    mya_subsector = models.CharField(max_length=256, null=True, blank=True)
    application = models.CharField(max_length=256, null=True, blank=True)
    title = models.CharField(max_length=256)
    description = models.TextField(null=True, blank=True)
    products_manufactured = models.TextField(null=True, blank=True)
    plan = models.TextField(null=True, blank=True)
    excom_provision = models.TextField(null=True, blank=True)
    technology = models.CharField(max_length=256, null=True, blank=True)
    impact = models.FloatField(null=True, blank=True)
    impact_co2mt = models.FloatField(null=True, blank=True)
    impact_production = models.FloatField(null=True, blank=True)
    impact_prod_co2mt = models.FloatField(null=True, blank=True)
    ods_phasedout = models.FloatField(null=True, blank=True)
    ods_phasedout_co2mt = models.FloatField(null=True, blank=True)
    substance_type = models.CharField(max_length=256, choices=SubstancesType.choices)
    hcfc_stage = models.FloatField(null=True, blank=True)
    capital_cost = models.FloatField(null=True, blank=True)
    operating_cost = models.FloatField(null=True, blank=True)
    effectiveness_cost = models.FloatField(null=True, blank=True)
    fund_disbursed = models.FloatField(null=True, blank=True)
    fund_disbursed_13 = models.FloatField(null=True, blank=True)
    date_completion = models.DateField(null=True, blank=True)
    date_actual = models.DateField(null=True, blank=True)
    date_comp_revised = models.DateField(null=True, blank=True)
    date_per_agreement = models.DateField(null=True, blank=True)
    date_per_decision = models.DateField(null=True, blank=True)
    umbrella_project = models.BooleanField(default=False)
    loan = models.BooleanField(default=False)
    intersessional_approval = models.BooleanField(default=False)
    retroactive_finance = models.BooleanField(default=False)
    local_ownership = models.FloatField(null=True, blank=True)
    export_to = models.FloatField(null=True, blank=True)
    status = models.ForeignKey(ProjectStatus, on_delete=models.CASCADE)
    remarks = models.TextField(null=True, blank=True)
    decisions = models.TextField(null=True, blank=True)

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
        storage=PROTECTED_STORAGE,
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
            return_str += " replacement: " + self.ods_replacement.name
        return return_str


class ProjectFund(models.Model):
    class FundType(models.TextChoices):
        ALLOCATED = "allocated", "Allocated"
        TRANSFERRED = "transferred", "Transferred"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="funds")
    amount = models.FloatField()
    support_13 = models.FloatField(default=0, null=True)
    meeting = models.IntegerField(null=True, blank=True)
    interest = models.FloatField(default=0, null=True)
    date = models.DateField(null=True, blank=True)
    fund_type = models.CharField(max_length=256, choices=FundType.choices)
    sort_order = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.project.title} {self.amount} {self.date}"


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
    meeting_of_report = models.CharField(max_length=255, null=True, blank=True)
    secretariat_comment = models.TextField(
        null=True, blank=True, verbose_name="Secretariat's Comment"
    )
    agency_response = models.TextField(
        null=True, blank=True, verbose_name="Agency's Response"
    )
