from django.conf import settings
from django.db import models
from core.models.base import AbstractWChemical, BaseWTimeFrameManager
from core.models.base_country_programme import (
    AbstractCPComment,
    AbstractCPEmission,
    AbstractCPGeneration,
    AbstractCPPrices,
    AbstractCPRecord,
    AbstractCPReport,
    AbstractCPUsage,
)
from core.models.utils import get_protected_storage


class CPReport(AbstractCPReport):

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_cp_reports",
        help_text="User who created the report",
    )
    version_created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        default=None,
        related_name="created_cp_reports_version",
        help_text="User who created this report version",
    )

    class Meta:
        verbose_name = "CP report"
        verbose_name_plural = "CP reports"
        db_table = "cp_report"

    def __str__(self):
        return self.name


class CPRecord(AbstractCPRecord):
    country_programme_report = models.ForeignKey(
        "CPReport", on_delete=models.CASCADE, related_name="cprecords"
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
        "CPRecord", on_delete=models.CASCADE, related_name="record_usages"
    )

    class Meta:
        verbose_name = "CP usage"
        verbose_name_plural = "CP usages"
        db_table = "cp_usage"


class CPPrices(AbstractCPPrices):
    country_programme_report = models.ForeignKey(
        "CPReport",
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
        "CPReport",
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
        "CPReport",
        on_delete=models.CASCADE,
        related_name="cpemissions",
    )

    class Meta:
        verbose_name = "CP emission"
        verbose_name_plural = "CP emissions"
        db_table = "cp_emission"

    def __str__(self):
        return self.country_programme_report.name


class CPReportFormatColumn(models.Model):
    usage = models.ForeignKey("Usage", on_delete=models.CASCADE)
    time_frame = models.ForeignKey("TimeFrame", on_delete=models.CASCADE)
    header_name = models.CharField(max_length=256, null=True, blank=True)
    section = models.CharField(max_length=10)
    sort_order = models.FloatField(null=True, blank=True)

    objects = BaseWTimeFrameManager()


class CPReportFormatRow(AbstractWChemical):
    time_frame = models.ForeignKey("TimeFrame", on_delete=models.CASCADE)
    section = models.CharField(max_length=10)
    sort_order = models.FloatField(null=True, blank=True)

    objects = BaseWTimeFrameManager()


class CPReportSections(models.Model):
    country_programme_report = models.OneToOneField(
        "CPReport",
        on_delete=models.CASCADE,
        related_name="cpreportedsections",
    )

    reported_section_a = models.BooleanField(default=False)
    reported_section_b = models.BooleanField(default=False)
    reported_section_c = models.BooleanField(default=False)
    reported_section_d = models.BooleanField(default=False)
    reported_section_e = models.BooleanField(default=False)
    reported_section_f = models.BooleanField(default=False)


class CPFile(models.Model):
    def upload_path(self, filename):
        return f"cp_files/{self.country.name}/{self.year}/{filename}"

    uploaded_at = models.DateTimeField(
        auto_now_add=True, help_text="Date of file upload"
    )
    country = models.ForeignKey(
        "Country", on_delete=models.CASCADE, related_name="cpfiles"
    )
    year = models.IntegerField()
    filename = models.CharField(max_length=100)
    file = models.FileField(storage=get_protected_storage, upload_to=upload_path)

    class Meta:
        ordering = ["-uploaded_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["country", "year", "filename"],
                name="unique_country_year_filename",
            )
        ]


class CPHistory(models.Model):
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Date of creation of the event"
    )
    country_programme_report = models.ForeignKey(
        "CPReport",
        on_delete=models.CASCADE,
        related_name="cphistory",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="updated_cp_reports",
        help_text="User who updated the report",
    )
    reporting_officer_name = models.CharField(max_length=248, blank=True, null=True)
    reporting_officer_email = models.EmailField(max_length=248, blank=True, null=True)
    event_description = models.TextField(blank=True)
    report_version = models.FloatField(default=1)

    class Meta:
        ordering = ["-created_at"]


class CPComment(AbstractCPComment):
    country_programme_report = models.ForeignKey(
        "CPReport",
        on_delete=models.CASCADE,
        related_name="cpcomments",
    )
