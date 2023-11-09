from django.db import models
from core.models.blend import Blend

from core.models.country import Country
from core.models.substance import Substance
from core.models.usage import Usage


class AbstractCPReport(models.Model):
    class CPReportStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        FINAL = "final", "Final"

    name = models.CharField(max_length=248)
    year = models.IntegerField()
    status = models.CharField(
        max_length=10, choices=CPReportStatus.choices, default=CPReportStatus.DRAFT
    )
    version = models.FloatField(default=1)
    reporting_entry = models.CharField(max_length=248, null=True, blank=True)
    reporting_email = models.CharField(max_length=248, null=True, blank=True)
    submission_date = models.DateField(null=True, blank=True)
    comment = models.TextField(null=True, blank=True)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)

    class Meta:
        abstract = True


class AbstractCPRecord(models.Model):
    blend = models.ForeignKey(Blend, on_delete=models.CASCADE, null=True, blank=True)
    substance = models.ForeignKey(
        Substance, on_delete=models.CASCADE, null=True, blank=True
    )
    display_name = models.CharField(max_length=248, null=True, blank=True)
    section = models.CharField(max_length=164)
    imports = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )
    import_quotas = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )
    exports = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )
    export_quotas = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )
    production = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )
    manufacturing_blends = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )
    banned_date = models.DateField(null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)

    source_file = models.CharField(max_length=248)

    class Meta:
        abstract = True


class AbstractCPUsage(models.Model):
    usage = models.ForeignKey(Usage, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=25, decimal_places=15)

    class Meta:
        abstract = True


class AbstractCPPrices(models.Model):
    blend = models.ForeignKey(Blend, on_delete=models.CASCADE, null=True, blank=True)
    substance = models.ForeignKey(
        Substance, on_delete=models.CASCADE, null=True, blank=True
    )
    display_name = models.CharField(max_length=248, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    source_file = models.CharField(max_length=248)

    previous_year_price = models.CharField(max_length=248, null=True, blank=True)
    current_year_price = models.CharField(max_length=248, null=True, blank=True)

    class Meta:
        abstract = True


# model used for data regarding only HFC-23 substance
class AbstractCPGeneration(models.Model):
    all_uses = models.DecimalField(
        max_digits=25,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Captured for all uses",
    )
    feedstock = models.DecimalField(
        max_digits=25,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Captured for feedstock uses within your country",
    )
    destruction = models.DecimalField(
        max_digits=25,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Captured for destruction",
    )

    source_file = models.CharField(max_length=248)

    class Meta:
        abstract = True


# model used for data regarding only HFC-23 substance
class AbstractCPEmission(models.Model):
    facility = models.CharField(max_length=256, help_text="Facility name or identifier")
    total = models.DecimalField(
        max_digits=25,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Total amount generated",
    )
    all_uses = models.DecimalField(
        max_digits=25,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Amount generated and captured - For all uses",
    )
    feedstock_gc = models.DecimalField(
        max_digits=25,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Amount generated and captured - For feedstock use in your country",
    )
    destruction = models.DecimalField(
        max_digits=25,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Amount generated and captured - For destruction",
    )
    feedstock_wpc = models.DecimalField(
        max_digits=25,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Captured for feedstock uses within your country",
    )
    destruction_wpc = models.DecimalField(
        max_digits=25,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Amount used for feedstock without prior capture",
    )
    generated_emissions = models.DecimalField(
        max_digits=25,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Captured for destruction",
    )

    remarks = models.TextField(null=True, blank=True)
    source_file = models.CharField(max_length=248)

    class Meta:
        abstract = True
