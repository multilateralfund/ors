from django.conf import settings
from django.db import models

from core.models.base_country_programme import (
    AbstractCPEmission,
    AbstractCPGeneration,
    AbstractCPReport,
)


class FinalReportsView(AbstractCPReport):
    """
    Final Reports database view

    This view is used to get the list of final reports for the country programme

    It is a union of the cp_report and cp_report_archive tables
    containing the final reports and the archived reports (of the current draft reports)
    """

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        related_name="final_reports_created_by",
        help_text="User who created the report",
    )
    version_created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        related_name="final_reports_version_created_by",
        help_text="User who created this archived report version",
    )
    is_archive = models.BooleanField()

    class Meta:
        managed = False
        db_table = "final_reports_view"


class AllCPRecordsView(models.Model):
    """
    All CP Records database view

    This view is used to get the list of all records for the country programme

    It is a union of the cp_records, cp_records_archive tables
    containing information about records, reports and chemicals
    """

    substance_id = models.IntegerField()
    substance_name = models.CharField(max_length=255)
    substance_group_id = models.IntegerField()
    substance_group_name = models.CharField(max_length=255)
    blend_id = models.IntegerField()
    blend_name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255)

    section = models.CharField(max_length=255)
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

    country_programme_report_id = models.IntegerField()
    source_file = models.CharField(max_length=248)
    country_id = models.IntegerField()
    country_name = models.CharField(max_length=255)
    country_is_lvc = models.BooleanField()
    report_version = models.IntegerField()
    report_created_at = models.DateTimeField()
    report_year = models.IntegerField()
    is_archive = models.BooleanField()

    class Meta:
        managed = False
        db_table = "all_cp_records_view"


class AllCPUSagesView(models.Model):
    """
    All CP Usages database view

    This view is used to get the list of all usages for the country programme

    It is a union of the cp_usages, cp_usages_archive tables

    """

    usage_id = models.IntegerField()
    quantity = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )
    country_programme_record_id = models.IntegerField()
    is_archive = models.BooleanField()

    class Meta:
        managed = False
        db_table = "all_cp_usage_view"


class AllPricesView(models.Model):
    """
    All Prices database view

    This view is used to get the list of all prices for the country programme

    It is a union of the cp_prices, cp_prices_archive tables

    """

    substance_id = models.IntegerField()
    substance_name = models.CharField(max_length=255)
    substance_group_id = models.IntegerField()
    substance_group_name = models.CharField(max_length=255)
    blend_id = models.IntegerField()
    blend_name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255)

    remarks = models.TextField(null=True, blank=True)
    is_retail = models.BooleanField(default=False)
    is_fob = models.BooleanField(default=False)

    previous_year_price = models.CharField(max_length=248, null=True, blank=True)
    current_year_price = models.CharField(max_length=248, null=True, blank=True)

    country_programme_report_id = models.IntegerField()
    source_file = models.CharField(max_length=248)
    country_id = models.IntegerField()
    country_name = models.CharField(max_length=255)
    report_version = models.IntegerField()
    report_created_at = models.DateTimeField()
    report_year = models.IntegerField()
    is_archive = models.BooleanField()

    class Meta:
        managed = False
        db_table = "all_prices_view"


class AllGenerationsView(AbstractCPGeneration):
    """
    All Generations database view

    This view is used to get the list of all generations for the country programme

    It is a union of the cp_generations, cp_generations_archive tables

    """

    country_programme_report_id = models.IntegerField()
    country_id = models.IntegerField()
    country_name = models.CharField(max_length=255)
    report_version = models.IntegerField()
    report_created_at = models.DateTimeField()
    report_year = models.IntegerField()
    is_archive = models.BooleanField()

    class Meta:
        managed = False
        db_table = "all_generations_view"


class AllEmissionsView(AbstractCPEmission):
    """
    All Emissions database view

    This view is used to get the list of all emissions for the country programme

    It is a union of the cp_emissions, cp_emissions_archive tables

    """

    country_programme_report_id = models.IntegerField()
    country_id = models.IntegerField()
    country_name = models.CharField(max_length=255)
    report_version = models.IntegerField()
    report_created_at = models.DateTimeField()
    report_year = models.IntegerField()
    is_archive = models.BooleanField()

    class Meta:
        managed = False
        db_table = "all_emissions_view"
