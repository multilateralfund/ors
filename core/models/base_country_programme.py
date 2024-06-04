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

    def get_consumption_value(self, use_sectorial_total=True):
        """
        Get the consumption value for the record (imports - exports + production)

        @param use_sectorial_total: if True, the sectorial total value will be used
            only if there are no imports, exports or production values

        """
        if any([self.imports, self.exports, self.production]):
            return (self.imports or 0) - (self.exports or 0) + (self.production or 0)

        # if there are no imports, exports or production values use the sectorial total
        if use_sectorial_total:
            return self.get_sectorial_total()

        return 0


class AbstractCPUsage(models.Model):
    usage = models.ForeignKey(Usage, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=25, decimal_places=15)

    class Meta:
        abstract = True


class AbstractCPPrices(AbstractWChemical):
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
