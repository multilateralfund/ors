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
    section = models.CharField(max_length=164)
    imports = models.DecimalField(
        max_digits=12, decimal_places=3, null=True, blank=True
    )
    import_quotas = models.DecimalField(
        max_digits=12, decimal_places=3, null=True, blank=True
    )
    exports = models.DecimalField(
        max_digits=12, decimal_places=3, null=True, blank=True
    )
    production = models.DecimalField(
        max_digits=12, decimal_places=3, null=True, blank=True
    )
    manufacturing_blends = models.DecimalField(
        max_digits=12, decimal_places=3, null=True, blank=True
    )
    banned_date = models.DateField(null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)

    source_file = models.CharField(max_length=248)

    def __str__(self):
        return (
            self.country_programme_report.name
            + " - "
            + (self.blend.name if self.blend else self.substance.name)
        )


class CountryProgrammeUsage(models.Model):
    country_programme_record = models.ForeignKey(
        CountryProgrammeRecord, on_delete=models.CASCADE
    )
    usage = models.ForeignKey(Usage, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)
