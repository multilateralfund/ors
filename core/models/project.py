from colorfield.fields import ColorField
from django.db import models
from core.models.agency import Agency
from core.models.blend import Blend

from core.models.country import Country
from core.models.substance import Substance


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
        return self.filter(name__iexact=name_str).first()


class ProjectSector(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    sort_order = models.FloatField(null=True, blank=True)

    objects = ProjectSectorManager()

    def __str__(self):
        return self.name


class ProjectSubSector(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    sector = models.ForeignKey(ProjectSector, on_delete=models.CASCADE)
    sort_order = models.FloatField(null=True, blank=True)

    objects = ProjectSectorManager()

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
    code = models.CharField(max_length=128, null=True, blank=True)
    approval_meeting_no = models.IntegerField(null=True, blank=True)
    project_type = models.ForeignKey(ProjectType, on_delete=models.CASCADE)
    project_duration = models.IntegerField(null=True, blank=True)
    subsector = models.ForeignKey(ProjectSubSector, on_delete=models.CASCADE)
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
    umbrella_project = models.BooleanField(default=False)
    loan = models.BooleanField(default=False)
    intersessional_approval = models.BooleanField(default=False)
    retroactive_finance = models.BooleanField(default=False)
    local_ownership = models.FloatField(null=True, blank=True)
    export_to = models.FloatField(null=True, blank=True)
    status = models.ForeignKey(ProjectStatus, on_delete=models.CASCADE)
    remarks = models.TextField(null=True, blank=True)
    project_file = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.title


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
