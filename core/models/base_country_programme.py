from django.db import models
from core.models.base import AbstractWChemical
from core.models.usage import Usage


class AbstractCPReport(models.Model):
    class CPReportStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        FINAL = "final", "Final"

    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Date of creation of the report"
    )
    name = models.CharField(max_length=248)
    year = models.IntegerField()
    status = models.CharField(
        max_length=10, choices=CPReportStatus.choices, default=CPReportStatus.FINAL
    )
    version = models.FloatField(default=1)
    reporting_entry = models.CharField(max_length=248, null=True, blank=True)
    reporting_email = models.CharField(max_length=248, null=True, blank=True)
    submission_date = models.DateField(null=True, blank=True)
    # Section F comment
    comment = models.TextField(null=True, blank=True)
    country = models.ForeignKey("Country", on_delete=models.CASCADE)

    class Meta:
        abstract = True


class CPRecordAbstractManager(models.Manager):
    def get_for_year(self, year):
        return (
            self.select_related(
                "substance__group",
                "blend",
                "country_programme_report__country",
            )
            .prefetch_related(
                "record_usages",
                "blend__components",
            )
            .filter(country_programme_report__year=year)
            .order_by(
                "country_programme_report__country__name",
                "substance__sort_order",
                "blend__sort_order",
            )
        )

    def get_for_years(self, min_year, max_year):
        return (
            self.select_related(
                "substance__group",
                "blend",
                "country_programme_report__country",
            )
            .prefetch_related(
                "record_usages",
                "blend__components",
            )
            .filter(
                country_programme_report__year__gte=min_year,
                country_programme_report__year__lte=max_year,
            )
            .order_by(
                "country_programme_report__country__name",
                "substance__sort_order",
                "blend__sort_order",
            )
        )


class AbstractCPRecord(AbstractWChemical):
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

    objects = CPRecordAbstractManager()

    class Meta:
        abstract = True

    def get_sectorial_total(self):
        """
        Get the sectorial total value for the record
        (sum of all the usages for the record)
        For Methyl Bromide the sectorial total will only contain the non-Qps values

        """

        if self.substance and "methyl bromide" in self.substance.name.lower():
            return sum(
                usage.quantity
                for usage in self.record_usages.filter(
                    usage__full_name__icontains="non-qps"
                )
            )
        return sum(usage.quantity for usage in self.record_usages.all())

    def get_consumption_value(self, using_consumption_value=True):
        """
        Get the consumption value for the record (imports - exports + production)

        @param using_consumption_value: bool
        If True, the consumption value will be calculated using
            the imports, exports and production values
        Else the consumption value will be calculated using the sectorial total

        """

        # For Methyl Bromide the consumption value will only contain the non-Qps values
        if self.substance and "methyl bromide" in self.substance.name.lower():
            return self.get_sectorial_total()

        if using_consumption_value:
            return (self.imports or 0) - (self.exports or 0) + (self.production or 0)

        return self.get_sectorial_total()


class AbstractCPUsage(models.Model):
    usage = models.ForeignKey(Usage, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=25, decimal_places=15)

    class Meta:
        abstract = True


class AbstractCPPrices(AbstractWChemical):
    display_name = models.CharField(max_length=248, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    source_file = models.CharField(max_length=248)

    is_retail = models.BooleanField(default=False)
    is_fob = models.BooleanField(default=False)

    previous_year_price = models.CharField(max_length=248, null=True, blank=True)
    current_year_price = models.CharField(max_length=248, null=True, blank=True)

    class Meta:
        abstract = True


# model used for data regarding only HFC-23 substance
class AbstractCPGeneration(models.Model):
    all_uses = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Captured for all uses",
    )
    feedstock = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Captured for feedstock uses within your country",
    )

    other_uses_quantity = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text=(
            "Production for exempted essential, critical, "
            "high-ambient-temperature or other uses within your country "
            "- Quantity"
        ),
    )

    other_uses_remarks = models.TextField(
        null=True,
        blank=True,
        help_text=(
            "Production for exempted essential, critical, "
            "high-ambient-temperature or other uses within your country "
            "- Decision / type of use or remarks"
        ),
    )

    # this is deprecated, was removed in frontend
    destruction = models.DecimalField(
        max_digits=25,
        decimal_places=10,
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
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Total amount generated (tonnes)",
    )
    stored_at_start_of_year = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Amount stored at the beginning of the year (tonnes)",
    )
    all_uses = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Amount generated and captured (tonnes) - For uses excluding feedstocks",
    )
    feedstock_gc = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Amount generated and captured (tonnes) - For feedstock use in your country",
    )
    destruction = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Amount generated and captured (tonnes) - For destruction",
    )
    feedstock_wpc = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Amount used for feedstock without prior capture (tonnes)",
    )
    destruction_wpc = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Amount destroyed in the facility without prior capture (tonnes)",
    )
    generated_emissions = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Amount of generated emissions (tonnes)",
    )
    stored_at_end_of_year = models.DecimalField(
        max_digits=25,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Amount stored at the end of the year (tonnes)",
    )

    remarks = models.TextField(null=True, blank=True)
    source_file = models.CharField(max_length=248)

    class Meta:
        abstract = True


# General per-report-section comments for Country and Secretariat for 2023-onward
class AbstractCPComment(models.Model):
    class CPCommentSection(models.TextChoices):
        SECTION_A = "section_a", "Section A"
        SECTION_B = "section_b", "Section B"
        SECTION_C = "section_c", "Section C"
        SECTION_D = "section_d", "Section D"
        SECTION_E = "section_e", "Section E"
        SECTION_F = "section_f", "Section F"

    class CPCommentType(models.TextChoices):
        COMMENT_COUNTRY = "comment_country", "Comment Country"
        COMMENT_SECRETARIAT = "comment_secretariat", "Comment Secretariat"

    section = models.CharField(max_length=50, choices=CPCommentSection.choices)
    comment_type = models.CharField(max_length=50, choices=CPCommentType.choices)
    comment = models.TextField(blank=True)

    class Meta:
        abstract = True
