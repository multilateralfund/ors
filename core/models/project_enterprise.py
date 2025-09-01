from django.db import models

from core.models.blend import Blend
from core.models.project import Project
from core.models.substance import Substance

# pylint: disable=C0302


class ProjectEnterprise(models.Model):

    class EnterpriseStatus(models.TextChoices):
        PENDING = "Pending Approval", "Pending Approval"
        APPROVED = "Approved", "Approved"

    code = models.CharField(
        max_length=128,
        null=True,
        blank=True,
        help_text="System-generated set of letters and numbers identifying the enterprise",
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="enterprises",
        blank=True,
        null=True,
    )
    enterprise = models.CharField(
        max_length=256,
        help_text="Name of the enterprise",
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
    remarks = models.TextField(
        null=True,
        blank=True,
        help_text="Any remark on the enterprise",
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
    enterprise = models.ForeignKey(
        ProjectEnterprise,
        on_delete=models.CASCADE,
        related_name="ods_odp",
        help_text="Enterprise linked to this ODS/ODP entry",
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
    ods_replacement_phase_in = models.CharField(
        max_length=256,
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
