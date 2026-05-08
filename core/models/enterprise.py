from django.db import models

from core.models.blend import Blend
from core.models.substance import Substance

# pylint: disable=C0302


class EnterpriseStatus(models.Model):
    name = models.CharField(max_length=64, unique=True)

    def __str__(self):
        return self.name


class EnterpriseManager(models.Manager):
    def get_next_serial_number(self, country_id, first3lettersofname):
        return (
            self.filter(
                country_id=country_id, code__contains=f"/{first3lettersofname}/"
            ).count()
            + 1
        )


class Enterprise(models.Model):
    country = models.ForeignKey(
        "core.Country",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="enterprises",
        help_text="Name of the country",
    )
    agency = models.ForeignKey(
        "core.Agency",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="enterprises",
        help_text="Name of agency",
    )
    legacy_code = models.CharField(
        max_length=128,
        null=True,
        blank=True,
        help_text="Legacy code from the previous system, if any",
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
    location = models.TextField(
        null=True,
        blank=True,
        help_text="Name of the city where the enterprise is located",
    )
    city = models.CharField(
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
    project_type = models.ForeignKey(
        "core.ProjectType",
        on_delete=models.PROTECT,
        related_name="enterprises",
        null=True,
        blank=True,
        help_text="Type of project (e.g., demonstration, investment, technical assistance)",
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
    status = models.ForeignKey(
        EnterpriseStatus,
        on_delete=models.PROTECT,
        related_name="enterprises",
        null=True,
        blank=True,
        help_text="Progress status (e.g., new, on-going, closed, transferred)",
    )
    project_duration = models.IntegerField(
        null=True,
        blank=True,
        help_text="Duration of project implementation from approval (in months)",
    )
    local_ownership = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        help_text="Percentage of Article 5 ownership of the enterprise",
    )
    export_to_non_a5 = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        help_text="Percentage of produce exported to non-A5 countries",
    )
    revision_number = models.IntegerField(
        null=True,
        blank=True,
        help_text="Revision number",
    )
    meeting = models.ForeignKey(
        "core.Meeting",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="enterprises",
        help_text="Meeting where the project was approved",
    )
    date_of_approval = models.DateField(
        null=True,
        blank=True,
        help_text="Month and year of meeting when project was approved",
    )
    chemical_phased_out = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Total quantity of chemical phased out (mt)",
    )
    impact = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Total ODP tonnes phased out",
    )
    funds_approved = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Funds approved/allocated for the enterprise (US $)",
    )
    capital_cost_approved = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Capital cost approved/allocated for the enterprise (US $)",
    )  # (ICC)
    operating_cost_approved = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Operating cost approved/allocated for enterprise (US $)",
    )  # (IOC)
    cost_effectiveness_approved = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Cost effectiveness approved (US $/kg)",
    )
    funds_disbursed = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Funds disbursed to the enterprise (US $)",
    )
    capital_cost_disbursed = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Capital cost disbursed to the enterprise (US $)",
    )
    operating_cost_disbursed = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Operating cost disbursed to the enterprise (US $)",
    )
    cost_effectiveness_actual = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Actual cost effectiveness (US $)/kg",
    )
    co_financing_planned = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        help_text="Co-financing by the enterprise (planned) (US $)",
    )
    co_financing_actual = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        help_text="Co-financing by the enterprise (actual) (US $)",
    )
    funds_transferred = models.DecimalField(
        max_digits=20,
        decimal_places=3,
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
        help_text="Date of recording of disbursement to the enterprise",
    )
    date_of_revision = models.DateField(
        null=True,
        blank=True,
        help_text="Date when records related to the enterprise are introduced",
    )

    objects = EnterpriseManager()

    def generate_code(self):
        # code has the following format: country_iso3/first3lettersofname/serialnumber
        if self.country:
            country_iso3 = self.country.iso3
        else:
            country_iso3 = "-"

        name_without_spaces = self.name.replace(" ", "")
        first3lettersofname = (
            name_without_spaces[:3]
            if len(name_without_spaces) >= 3
            else name_without_spaces
        ).upper()
        serial_number = self.__class__.objects.get_next_serial_number(
            self.country_id, first3lettersofname
        )
        self.code = f"{country_iso3}/{first3lettersofname}/{serial_number}"

    def __str__(self):
        return f"{self.code}"


class EnterpriseOdsOdp(models.Model):
    enterprise = models.ForeignKey(
        Enterprise,
        on_delete=models.CASCADE,
        related_name="ods_odp",
        help_text="Enterprise linked to this ODS/ODP entry",
    )
    ods_substance = models.ForeignKey(
        Substance,
        on_delete=models.CASCADE,
        related_name="enterprise_ods",
        help_text="Substance - baseline technology",
        null=True,
        blank=True,
    )
    ods_display_name = models.CharField(max_length=256, null=True, blank=True)
    ods_blend = models.ForeignKey(
        Blend,
        on_delete=models.CASCADE,
        related_name="enterprise_ods",
        null=True,
        blank=True,
    )
    consumption = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Amount of the controlled substance to be phased out (mt)",
    )
    selected_alternative = models.CharField(
        max_length=128,
        blank=True,
        help_text="""
        Name of alternative technology or chemical
        """,
    )
    chemical_phased_in_mt = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="""
            Amount of alternative being used in place of controlled chemical
        """,
    )

    @property
    def display_name(self):
        if self.ods_substance:
            return self.ods_substance.name
        if self.ods_blend:
            return self.ods_blend.name
        return ""
