from django.db import models

from core.models.blend import Blend
from core.models.project import Project
from core.models.substance import Substance
from core.models.utils import EnterpriseStatus

# pylint: disable=C0302


class EnterpriseManager(models.Manager):
    def get_next_serial_number(self, country_id, first3lettersofname):
        return (
            self.filter(
                country_id=country_id, code__contains=f"/{first3lettersofname}/"
            ).count()
            + 1
        )


class Enterprise(models.Model):

    status = models.CharField(
        max_length=64,
        choices=EnterpriseStatus.choices,
        default=EnterpriseStatus.PENDING,
    )
    code = models.CharField(
        max_length=128,
        null=True,
        blank=True,
        help_text="System-generated set of letters and numbers identifying the enterprise",
    )
    name = models.CharField(
        max_length=256,
        help_text="Name of the enterprise",
    )
    country = models.ForeignKey(
        "core.Country",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="enterprises",
        help_text="Country where the enterprise is located",
    )
    location = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Name of the city where the enterprise is located",
    )
    stage = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Stage of the HPMP relating to the enterprise",
    )
    sector = models.ForeignKey(
        "core.ProjectSector",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="enterprises",
        help_text="""Sector related to the enterprise (e.g., aerosol, fire-fighting, foam, production,
                    refrigeration, solvent)""",
    )
    subsector = models.ForeignKey(
        "core.ProjectSubSector",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="enterprises",
        help_text="Name of the sub-sector within each sector",
    )
    application = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Name of applications",
    )
    local_ownership = models.FloatField(
        null=True,
        blank=True,
        help_text="Percentage of Article 5 ownership of the enterprise",
    )
    export_to_non_a5 = models.FloatField(
        null=True,
        blank=True,
        help_text="Percentage of produce exported to non-A5 countries",
    )
    date_of_revision = models.DateField(
        null=True,
        blank=True,
        help_text="Date of the latest revision of the project",
    )

    objects = EnterpriseManager()

    def __str__(self):
        return f"{self.name} ({self.code})"

    def generate_code(self):
        # code has the following format: country_iso3/first3lettersofname/serialnumber
        if self.country:
            country_iso3 = self.country.iso3
        else:
            country_iso3 = "-"
        first3lettersofname = (
            self.name[:3] if len(self.name) >= 3 else self.name
        ).upper()
        serial_number = self.__class__.objects.get_next_serial_number(
            self.country_id, first3lettersofname
        )
        self.code = f"{country_iso3}/{first3lettersofname}/{serial_number}"

    def save(self, *args, **kwargs):
        self.generate_code()
        return super().save(*args, **kwargs)


class ProjectEnterprise(models.Model):

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="enterprises",
        blank=True,
        null=True,
    )
    enterprise = models.ForeignKey(
        Enterprise,
        on_delete=models.CASCADE,
        related_name="project_enterprises",
        help_text="Enterprise linked to this project enterprise entry",
    )
    agency = models.ForeignKey(
        "core.Agency",
        on_delete=models.PROTECT,
        related_name="project_enterprises",
        help_text="Agency responsible for this project enterprise entry",
    )
    project_type = models.ForeignKey(
        "core.ProjectType",
        on_delete=models.PROTECT,
        related_name="project_enterprises",
        null=True,
        blank=True,
        help_text="Type of project (e.g., demonstration, investment, technical assistance)",
    )
    capital_cost_approved = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Capital cost approved/allocated for the enterprise (US $)",
    )  # (ICC)
    operating_cost_approved = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Operating cost approved/allocated for enterprise (US $)",
    )  # (IOC)
    funds_disbursed = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Funds disbursed to the enterprise (US $)",
    )
    capital_cost_disbursed = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Capital cost disbursed to the enterprise (US $)",
    )
    operating_cost_disbursed = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Operating cost disbursed to the enterprise (US $)",
    )
    cost_effectiveness_actual = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Cost effectiveness actual (US $/kg)",
    )
    co_financing_planned = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Co-financing planned for the enterprise (US $)",
    )
    co_financing_actual = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Co-financing actual for the enterprise (US $)",
    )
    funds_transferred = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Funds transferred from one agency to another (US $)",
    )
    agency_remarks = models.TextField(
        null=True,
        blank=True,
        help_text="Text on remarks relating to the project by agency if any",
    )
    secretariat_remarks = models.TextField(
        null=True,
        blank=True,
        help_text="Text on remarks relating to the project by secretariat if any",
    )
    excom_provision = models.TextField(
        null=True,
        blank=True,
        help_text="Text on ExCom provision relating to the project if any",
    )
    date_of_report = models.DateField(
        null=True,
        blank=True,
        help_text="Date of the latest report of the project",
    )
    planned_completion_date = models.DateField(
        null=True,
        blank=True,
        help_text="Expected date of completion of the project",
    )
    actual_completion_date = models.DateField(
        null=True,
        blank=True,
        help_text="Actual date of completion of the project",
    )
    project_duration = models.IntegerField(
        null=True,
        blank=True,
        help_text="Duration of project implementation from approval (in months)",
    )
    status = models.CharField(
        max_length=64,
        choices=EnterpriseStatus.choices,
        default=EnterpriseStatus.PENDING,
    )
    chemical_phased_out = models.FloatField(
        null=True,
        blank=True,
        help_text="Total quantity of chemical phased out (mt)",
    )
    meeting = models.ForeignKey(
        "core.Meeting",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="enterprises",
        help_text="Meeting where the project was approved",
    )
    impact = models.TextField(
        null=True,
        blank=True,
        help_text="Total ODP tonnes phased out",
    )
    funds_approved = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Funds approved/allocated for the enterprise (US $)",
    )
    date_of_approval = models.DateField(
        null=True,
        blank=True,
        help_text="Month and year of meeting when project was approved",
    )

    def __str__(self):
        return f"Enterprise: {self.enterprise} (Project:{self.project})"


class ProjectEnterpriseOdsOdp(models.Model):
    project_enterprise = models.ForeignKey(
        ProjectEnterprise,
        on_delete=models.CASCADE,
        related_name="ods_odp",
        help_text="ProjectEnterprise linked to this ODS/ODP entry",
    )
    ods_substance = models.ForeignKey(
        Substance,
        on_delete=models.CASCADE,
        related_name="projectenterprise_ods",
        help_text="Substance - baseline technology",
        null=True,
        blank=True,
    )
    ods_blend = models.ForeignKey(
        Blend,
        on_delete=models.CASCADE,
        related_name="projectenterprise_ods",
        null=True,
        blank=True,
    )
    consumption = models.FloatField(
        null=True,
        blank=True,
        help_text="""
        Amount of the controlled substance to be phased out (mt)
    """,
    )
    selected_alternative = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="""
        Name of alternative technology or chemical
        """,
    )
    chemical_phased_in = models.FloatField(
        null=True,
        blank=True,
        help_text="""
            Amount of alternative being used in place of controlled chemical (mt)
        """,
    )

    @property
    def display_name(self):
        if self.ods_substance:
            return self.ods_substance.name
        if self.ods_blend:
            return self.ods_blend.name
        return ""
