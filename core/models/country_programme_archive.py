from django.db import models
from core.models.base_country_programme import (
    AbstractCPEmission,
    AbstractCPGeneration,
    AbstractCPPrices,
    AbstractCPReport,
    AbstractCPRecord,
    AbstractCPUsage,
)


class CPReportArchive(AbstractCPReport):
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Date of creation of the report archive"
    )

    class Meta:
        verbose_name = "CP report archive"
        verbose_name_plural = "CP reports archive"
        db_table = "cp_report_archive"

    def __str__(self):
        return f"{self.name} (v{self.version})"


class CPRecordArchive(AbstractCPRecord):
    country_programme_report = models.ForeignKey(
        CPReportArchive, on_delete=models.CASCADE, related_name="cprecords"
    )

    class Meta:
        verbose_name = "CP record archive"
        verbose_name_plural = "CP records archive"
        db_table = "cp_record_archive"

    def __str__(self):
        cp_report = self.country_programme_report
        return (
            str(self.id)
            + f" {cp_report.name} (v{cp_report.version}) - "
            + (self.blend.name if self.blend else self.substance.name)
        )


class CPUsageArchive(AbstractCPUsage):
    country_programme_record = models.ForeignKey(
        CPRecordArchive, on_delete=models.CASCADE, related_name="record_usages"
    )

    class Meta:
        verbose_name = "CP usage archive"
        verbose_name_plural = "CP usages archive"
        db_table = "cp_usage_archive"


class CPPricesArchive(AbstractCPPrices):
    country_programme_report = models.ForeignKey(
        CPReportArchive,
        on_delete=models.CASCADE,
    )

    class Meta:
        verbose_name = "CP price archive"
        verbose_name_plural = "CP prices archive"
        db_table = "cp_prices_archive"

    def __str__(self):
        cp_report = self.country_programme_report
        return f"{cp_report.name} (v{cp_report.version}) - " + (
            self.blend.name if self.blend else self.substance.name
        )


# model used for data regarding only HFC-23 substance
class CPGenerationArchive(AbstractCPGeneration):
    country_programme_report = models.ForeignKey(
        CPReportArchive,
        on_delete=models.CASCADE,
    )

    class Meta:
        verbose_name = "CP generation archive"
        verbose_name_plural = "CP generations archive"
        db_table = "cp_generation_archive"

    def __str__(self):
        cp_report = self.country_programme_report
        return f"{cp_report.name} (v{cp_report.version})"


# model used for data regarding only HFC-23 substance
class CPEmissionArchive(AbstractCPEmission):
    country_programme_report = models.ForeignKey(
        CPReportArchive,
        on_delete=models.CASCADE,
    )

    class Meta:
        verbose_name = "CP emission archive"
        verbose_name_plural = "CP emissions archive"
        db_table = "cp_emission_archive"

    def __str__(self):
        cp_report = self.country_programme_report
        return f"{cp_report.name} (v{cp_report.version})"
