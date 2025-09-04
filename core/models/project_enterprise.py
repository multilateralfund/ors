from django.db import models

from core.models.blend import Blend
from core.models.project import Project
from core.models.substance import Substance

# pylint: disable=C0302


class EnterpriseManager(models.Manager):
    def get_next_serial_number(self, country_id, first3lettersofname):
        return (
            self.filter(
                country_id=country_id,
                code__startswith=f"{country_id}/{first3lettersofname}/",
            ).count()
            + 1
        )


class Enterprise(models.Model):
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
    remarks = models.TextField(
        null=True,
        blank=True,
        help_text="Any remark on the enterprise",
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

    class EnterpriseStatus(models.TextChoices):
        PENDING = "Pending Approval", "Pending Approval"
        APPROVED = "Approved", "Approved"

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
    capital_cost_approved = models.FloatField(
        null=True,
        blank=True,
        help_text="Capital cost approved/allocated for the enterprise (US $)",
    )  # (ICC)
    operating_cost_approved = models.FloatField(
        null=True,
        blank=True,
        help_text="Operating cost approved/allocated for enterprise (US $)",
    )  # (IOC)
    funds_disbursed = models.FloatField(
        null=True,
        blank=True,
        help_text="Funds disbursed for the enterprise (US $)",
    )
    status = models.CharField(
        max_length=64,
        choices=EnterpriseStatus.choices,
        default=EnterpriseStatus.PENDING,
    )

    @property
    def funds_approved(self):
        """
        Calculated field (capital_cost_approved + operating_cost_approved)
        Funds approved/allocated for the enterprise (US $)
        """
        return None

    @property
    def cost_effectiveness_approved(self):
        """
        Calculated field = '(funds approved/(phase out*1000))'
        Cost-effectiveness as approved (US $/kg)
        """
        return None

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
    phase_out_mt = models.FloatField(
        null=True,
        blank=True,
        help_text="""
        Amount of the controlled substance to be phased out (mt)
        (Phase out (mt))
    """,
    )
    ods_replacement = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="""
        Name of alternative technology or chemical
        Replacement technology
        """,
    )
    ods_replacement_phase_in = models.FloatField(
        null=True,
        blank=True,
        help_text="""
            Amount of alternative 1 being used in place of controlled chemical 1
            (Replacement technology phased in (mt))
        """,
    )

    @property
    def display_name(self):
        if self.ods_substance:
            return self.ods_substance.name
        if self.ods_blend:
            return self.ods_blend.name
        return ""
