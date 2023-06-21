from django.db import models
from core.models.blend import Blend

from core.models.country import Country
from core.models.substance import Substance
from core.models.usage import Usage


class CountryProgrammeReport(models.Model):
    name = models.CharField(max_length=248)
    year = models.IntegerField()
    comment = models.TextField(null=True, blank=True)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class CountryProgrammeRecord(models.Model):
    blend = models.ForeignKey(Blend, on_delete=models.CASCADE, null=True, blank=True)
    substance = models.ForeignKey(
        Substance, on_delete=models.CASCADE, null=True, blank=True
    )
    country_programme_report = models.ForeignKey(
        CountryProgrammeReport, on_delete=models.CASCADE
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

    def __str__(self):
        return (
            str(self.id)
            + " "
            + self.country_programme_report.name
            + " - "
            + (self.blend.name if self.blend else self.substance.name)
        )


class CountryProgrammeUsage(models.Model):
    country_programme_record = models.ForeignKey(
        CountryProgrammeRecord, on_delete=models.CASCADE, related_name="record_usages"
    )
    usage = models.ForeignKey(Usage, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=25, decimal_places=15)


class CountryProgrammePrices(models.Model):
    country_programme_report = models.ForeignKey(
        CountryProgrammeReport,
        on_delete=models.CASCADE,
    )
    blend = models.ForeignKey(Blend, on_delete=models.CASCADE, null=True, blank=True)
    substance = models.ForeignKey(
        Substance, on_delete=models.CASCADE, null=True, blank=True
    )
    display_name = models.CharField(max_length=248, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    source_file = models.CharField(max_length=248)

    previous_year_price = models.DecimalField(
        max_digits=12, decimal_places=3, null=True, blank=True
    )
    previous_year_text = models.CharField(max_length=248, null=True, blank=True)

    current_year_price = models.DecimalField(
        max_digits=12, decimal_places=3, null=True, blank=True
    )
    current_year_text = models.CharField(max_length=248, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Country programme prices"

    def __str__(self):
        return (
            self.country_programme_report.name
            + " - "
            + (self.blend.name if self.blend else self.substance.name)
        )


# model used for data regarding only HFC-23 substance
class CPGeneration(models.Model):
    country_programme_report = models.ForeignKey(
        CountryProgrammeReport,
        on_delete=models.CASCADE,
    )
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
        verbose_name = "Country programme generation"
        verbose_name_plural = "Country programme generations"

    def __str__(self):
        return self.country_programme_report.name


# model used for data regarding only HFC-23 substance
class CPEmission(models.Model):
    country_programme_report = models.ForeignKey(
        CountryProgrammeReport,
        on_delete=models.CASCADE,
    )
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
        verbose_name = "Country programme emission"
        verbose_name_plural = "Country programme emissions"

    def __str__(self):
        return self.country_programme_report.name
