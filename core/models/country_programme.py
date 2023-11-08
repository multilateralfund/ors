from django.db import models
from core.models.base import BaseWTimeFrameManager
from core.models.base_country_programme import (
    AbstractCPEmission,
    AbstractCPGeneration,
    AbstractCPPrices,
    AbstractCPRecord,
    AbstractCPReport,
    AbstractCPUsage,
)
from core.models.time_frame import TimeFrame
from core.models.usage import Usage


class CPReport(AbstractCPReport):
    class Meta:
        verbose_name = "CP report"
        verbose_name_plural = "CP reports"
        db_table = "cp_report"

    def __str__(self):
        return self.name


class CPRecord(AbstractCPRecord):
    country_programme_report = models.ForeignKey(
        CPReport, on_delete=models.CASCADE, related_name="cprecords"
    )

    class Meta:
        verbose_name = "CP record"
        verbose_name_plural = "CP records"
        db_table = "cp_record"

    def __str__(self):
        return (
            str(self.id)
            + " "
            + self.country_programme_report.name
            + " - "
            + (self.blend.name if self.blend else self.substance.name)
        )


class CPUsage(AbstractCPUsage):
    country_programme_record = models.ForeignKey(
        CPRecord, on_delete=models.CASCADE, related_name="record_usages"
    )

    class Meta:
        verbose_name = "CP usage"
        verbose_name_plural = "CP usages"
        db_table = "cp_usage"


class CPPrices(AbstractCPPrices):
    country_programme_report = models.ForeignKey(
        CPReport,
        on_delete=models.CASCADE,
        related_name="prices",
    )

    class Meta:
        verbose_name = "CP price"
        verbose_name_plural = "CP prices"
        db_table = "cp_prices"

    def __str__(self):
        return (
            self.country_programme_report.name
            + " - "
            + (self.blend.name if self.blend else self.substance.name)
        )


# model used for data regarding only HFC-23 substance
class CPGeneration(AbstractCPGeneration):
    country_programme_report = models.ForeignKey(
        CPReport,
        on_delete=models.CASCADE,
        related_name="cpgenerations",
    )

    class Meta:
        verbose_name = "CP generation"
        verbose_name_plural = "CP generations"
        db_table = "cp_generation"

    def __str__(self):
        return self.country_programme_report.name


# model used for data regarding only HFC-23 substance
class CPEmission(AbstractCPEmission):
    country_programme_report = models.ForeignKey(
        CPReport,
        on_delete=models.CASCADE,
        related_name="cpemissions",
    )

    class Meta:
        verbose_name = "CP emission"
        verbose_name_plural = "CP emissions"
        db_table = "cp_emission"

    def __str__(self):
        return self.country_programme_report.name


class CPReportFormat(models.Model):
    usage = models.ForeignKey(Usage, on_delete=models.CASCADE)
    time_frame = models.ForeignKey(TimeFrame, on_delete=models.CASCADE)
    section = models.CharField(max_length=10)
    sort_order = models.FloatField(null=True, blank=True)

    objects = BaseWTimeFrameManager()
