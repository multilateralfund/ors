import os
from decimal import Decimal

from django.contrib.postgres import fields
from django.db import models
from django.urls import reverse
from django.utils.functional import cached_property
from django.utils.html import format_html

from core.models.country import Country
from core.models.meeting import Meeting
from core.models.utils import get_protected_storage

US_SCALE_OF_ASSESSMENT = Decimal("22")

# Scale of Assessment


class Replenishment(models.Model):
    start_year = models.IntegerField()
    end_year = models.IntegerField()
    amount = models.DecimalField(max_digits=30, decimal_places=15)

    def __str__(self):
        return f"Replenishment ({self.start_year} - {self.end_year})"

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["start_year"], name="unique_start_year"),
            models.UniqueConstraint(fields=["end_year"], name="unique_end_year"),
        ]


class ScaleOfAssessmentVersion(models.Model):
    replenishment = models.ForeignKey(
        Replenishment,
        on_delete=models.PROTECT,
        related_name="scales_of_assessment_versions",
    )
    version = models.IntegerField(default=0)
    is_final = models.BooleanField(default=False)
    meeting_number = models.CharField(max_length=32, default="")
    decision_number = models.CharField(max_length=32, default="")
    comment = models.TextField(blank=True, default="")

    currency_date_range_start = models.CharField(max_length=32, blank=True)
    currency_date_range_end = models.CharField(max_length=32, blank=True)

    def upload_path(self, filename):
        # pylint: disable=line-too-long
        return f"scale_of_assessment_files/{self.replenishment.start_year}-{self.replenishment.end_year}/Version_{self.version}__{filename}"

    decision_pdf = models.FileField(
        storage=get_protected_storage,
        upload_to=upload_path,
        null=True,
        blank=True,
    )

    @property
    def decision_pdf_name(self):
        if self.decision_pdf:
            return os.path.basename(self.decision_pdf.name)
        return None

    def __str__(self):
        return (
            f"Scale of Assessment Version {self.version} "
            f"({self.replenishment.start_year} - {self.replenishment.end_year})"
        )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["replenishment", "version"], name="unique_replenishment_version"
            )
        ]


class ScaleOfAssessment(models.Model):
    """
    Contribution to a replenishment, used in Scale of Assessment.
    """

    version = models.ForeignKey(
        ScaleOfAssessmentVersion,
        on_delete=models.PROTECT,
        related_name="scales_of_assessment",
        null=True,
    )
    country = models.ForeignKey(
        Country, on_delete=models.PROTECT, related_name="contributions"
    )
    currency = models.CharField(max_length=64)
    exchange_rate = models.DecimalField(max_digits=30, decimal_places=15, null=True)
    bilateral_assistance_amount = models.DecimalField(
        max_digits=30, decimal_places=15, default=0
    )
    un_scale_of_assessment = models.DecimalField(
        max_digits=30, decimal_places=15, null=True
    )
    override_adjusted_scale_of_assessment = models.DecimalField(
        max_digits=30, decimal_places=15, null=True
    )
    average_inflation_rate = models.DecimalField(
        max_digits=30, decimal_places=15, null=True
    )
    override_qualifies_for_fixed_rate_mechanism = models.BooleanField(
        default=False, null=True
    )
    # This might show an incorrect None values for older data, but its purpose
    # is to actually help when populating data from 2021-onwards
    opted_for_ferm = models.BooleanField(null=True)

    @cached_property
    def un_assessment_sum(self):
        return (
            ScaleOfAssessment.objects.filter(version=self.version)
            .exclude(country__iso3="USA")
            .aggregate(models.Sum("un_scale_of_assessment", default=0))[
                "un_scale_of_assessment__sum"
            ]
        )

    @property
    def adjusted_scale_of_assessment(self):
        if self.country.iso3 == "USA":
            return US_SCALE_OF_ASSESSMENT

        if self.override_adjusted_scale_of_assessment is not None:
            return self.override_adjusted_scale_of_assessment

        if self.un_scale_of_assessment is None:
            return None

        if self.un_assessment_sum is None:
            return None

        return (self.un_scale_of_assessment / self.un_assessment_sum) * (
            Decimal("100") - US_SCALE_OF_ASSESSMENT
        )

    @property
    def qualifies_for_fixed_rate_mechanism(self):
        if self.average_inflation_rate is None:
            return False
        return self.average_inflation_rate < Decimal("10")

    @property
    def amount(self):
        if self.adjusted_scale_of_assessment is None:
            return None

        return (
            Decimal(self.version.replenishment.amount)
            * self.adjusted_scale_of_assessment
            / Decimal("100")
        )

    @property
    def yearly_amount(self):
        if self.amount is None:
            return None
        return self.amount / Decimal(
            self.version.replenishment.end_year
            - self.version.replenishment.start_year
            + 1
        )

    @property
    def amount_local_currency(self):
        if self.exchange_rate is None:
            return None
        return self.amount * self.exchange_rate

    @property
    def yearly_amount_local_currency(self):
        if self.yearly_amount is None or self.exchange_rate is None:
            return None
        return self.yearly_amount * self.exchange_rate

    def __str__(self):
        return (
            f"Contribution (version {self.version.version}) {self.country.name} "
            f"({self.version.replenishment.start_year} - {self.version.replenishment.end_year})"
        )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["version", "country"], name="unique_version_country"
            )
        ]


class Invoice(models.Model):
    class InvoiceStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PARTIALLY_PAID = "partially_paid", "Partially paid"
        PAID = "paid", "Paid"

    country = models.ForeignKey(
        Country, on_delete=models.PROTECT, related_name="invoices"
    )

    year = models.IntegerField(null=True, blank=True)

    is_ferm = models.BooleanField(default=False)

    status = models.CharField(
        max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.PENDING
    )

    amount_usd = models.DecimalField(max_digits=30, decimal_places=15)
    amount_local_currency = models.DecimalField(
        max_digits=30, decimal_places=15, null=True
    )
    currency = models.CharField(max_length=64)
    exchange_rate = models.DecimalField(max_digits=30, decimal_places=15, null=True)

    number = models.CharField(max_length=128)
    date_of_issuance = models.DateField()
    date_sent_out = models.DateField(null=True, blank=True)
    date_paid = models.DateField(null=True, blank=True)

    date_first_reminder = models.DateField(null=True, blank=True)
    date_second_reminder = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Invoice {self.country.name} - {self.number}"


class InvoiceFile(models.Model):
    class InvoiceFileType(models.TextChoices):
        INVOICE = "Invoice", "Invoice"

    def upload_path(self, filename):
        return f"invoice_files/{self.invoice.country}/{self.invoice.number}__{filename}"

    uploaded_at = models.DateTimeField(
        auto_now_add=True, help_text="Date of invoice file upload"
    )
    invoice = models.ForeignKey(
        Invoice, on_delete=models.CASCADE, related_name="invoice_files"
    )
    filename = models.CharField(max_length=128)
    file = models.FileField(storage=get_protected_storage, upload_to=upload_path)
    file_type = models.CharField(
        max_length=16, choices=InvoiceFileType.choices, default=InvoiceFileType.INVOICE
    )

    def file_link(self):
        if self.file:
            url = reverse("replenishment-invoice-file-download", args=(self.id,))
            return format_html(f"<a href='{url}'>download</a>")

        return "No attachment"

    file_link.allow_tags = True


class Payment(models.Model):
    class PaymentStatus(models.TextChoices):
        PARTIALLY_PAID = "partially_paid", "Partially paid"
        PAID = "paid", "Paid"

    country = models.ForeignKey(
        Country, on_delete=models.PROTECT, related_name="payments"
    )
    invoice = models.ForeignKey(
        Invoice,
        related_name="payments",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    is_ferm = models.BooleanField(default=False)

    status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PAID
    )

    date = models.DateField()
    payment_for_years = fields.ArrayField(models.CharField(max_length=10), default=list)

    # Amounts assessed & received are both in USD.
    # Strangely, amount_assessed is what should be taken into account when calculating
    # available cash for the fund.
    # The difference between these two is basically the FERM gain/loss.
    amount_assessed = models.DecimalField(max_digits=30, decimal_places=15)
    amount_received = models.DecimalField(max_digits=30, decimal_places=15, null=True)

    amount_local_currency = models.DecimalField(
        max_digits=30, decimal_places=15, null=True
    )

    currency = models.CharField(max_length=64, default="USD")
    exchange_rate = models.DecimalField(max_digits=30, decimal_places=15, null=True)
    ferm_gain_or_loss = models.DecimalField(max_digits=30, decimal_places=15, null=True)

    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"Payment {self.country.name} - {self.payment_for_years}"


class PaymentFile(models.Model):
    class PaymentFileType(models.TextChoices):
        BANK_STATEMENT = "Bank Statement", "Bank Statement"
        PROMISSORY_NOTE = "Promissory Note", "Promissory Note"

    def upload_path(self, filename):
        return f"payment_files/{self.payment.country}/{self.payment.id}__{filename}"

    uploaded_at = models.DateTimeField(
        auto_now_add=True, help_text="Date of payment file upload"
    )
    payment = models.ForeignKey(
        Payment, on_delete=models.CASCADE, related_name="payment_files"
    )
    filename = models.CharField(max_length=128)
    file = models.FileField(storage=get_protected_storage, upload_to=upload_path)
    file_type = models.CharField(
        max_length=32,
        choices=PaymentFileType.choices,
        default=PaymentFileType.BANK_STATEMENT,
    )

    def file_link(self):
        if self.file:
            url = reverse("replenishment-payment-file-download", args=(self.id,))
            return format_html(f"<a href='{url}'>download</a>")

        return "No attachment"

    file_link.allow_tags = True


# Dashboard and Status of Contributions
class AbstractContributionStatus(models.Model):
    agreed_contributions = models.DecimalField(
        max_digits=30, decimal_places=15, default=0
    )
    cash_payments = models.DecimalField(max_digits=30, decimal_places=15, default=0)
    bilateral_assistance = models.DecimalField(
        max_digits=30, decimal_places=15, default=0
    )
    promissory_notes = models.DecimalField(max_digits=30, decimal_places=15, default=0)
    outstanding_contributions = models.DecimalField(
        max_digits=30, decimal_places=15, default=0
    )

    # These need to be present in both Annual and Triennial contributions
    bilateral_assistance_meeting = models.ForeignKey(
        Meeting, null=True, on_delete=models.PROTECT
    )
    bilateral_assistance_decision_number = models.CharField(
        max_length=32, blank=True, default=""
    )

    class Meta:
        abstract = True


class AnnualContributionStatus(AbstractContributionStatus):
    country = models.ForeignKey(
        Country,
        on_delete=models.PROTECT,
        related_name="annual_contributions_status",
    )
    year = models.IntegerField()

    def __str__(self):
        return f"Contribution Status {self.country.name} - {self.year}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["country", "year"], name="unique_country_year"
            )
        ]


class TriennialContributionStatus(AbstractContributionStatus):
    """
    Model is necessary because added annual data is not equal to the triennial data.
    Triennial data can be updated in the future when countries pay their contributions.
    """

    country = models.ForeignKey(
        Country,
        on_delete=models.PROTECT,
        related_name="triennial_contributions_status",
    )
    start_year = models.IntegerField()
    end_year = models.IntegerField()

    def __str__(self):
        return f"Triennial Contribution Status {self.country.name} - {self.start_year} - {self.end_year}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["country", "start_year", "end_year"],
                name="unique_country_start_year_end_year",
            )
        ]


class DisputedContribution(models.Model):
    country = models.ForeignKey(
        Country,
        on_delete=models.PROTECT,
        related_name="disputed_contributions",
        null=True,
    )
    year = models.IntegerField()
    meeting = models.ForeignKey(Meeting, null=True, on_delete=models.PROTECT)
    decision_number = models.CharField(max_length=32, blank=True, default="")

    amount = models.DecimalField(max_digits=30, decimal_places=15, default=0)
    comment = models.TextField(blank=True, default="")

    def __str__(self):
        return f"Disputed Contribution {self.year} - {self.amount}"


class FermGainLoss(models.Model):
    country = models.ForeignKey(
        Country,
        on_delete=models.PROTECT,
        related_name="ferm_gain_loss",
    )
    amount = models.DecimalField(max_digits=30, decimal_places=15, default=0)
    year = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return f"Ferm Gain/Loss {self.country.iso3} - {self.amount}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["country", "year"], name="unique_ferm_country_year"
            )
        ]


class ExternalIncome(models.Model):
    """
    LEGACY External income triennial-based data.

    This is now only kept for the miscellaneous_income, which will be migrated soon.
    """

    start_year = models.IntegerField()
    end_year = models.IntegerField()
    interest_earned = models.DecimalField(
        max_digits=30, decimal_places=15, default=Decimal(0)
    )
    miscellaneous_income = models.DecimalField(
        max_digits=30, decimal_places=15, default=Decimal(0)
    )

    def __str__(self):
        year_str = (
            f"{self.start_year} - {self.end_year}"
            if self.start_year != self.end_year
            else f"{self.start_year}"
        )
        return (
            f"Triennial External Income ({year_str}): interest {self.interest_earned}; "
            f"miscellaneous {self.miscellaneous_income}"
        )


class ExternalIncomeAnnual(models.Model):
    """
    "Interest earned" external income data; imported from the consolidated
    financial data file.
    """

    # Triennial start year, only != None if this is for a triennial
    triennial_start_year = models.IntegerField(null=True, default=None)

    # Will only be populated for yearly OR quarterly data
    year = models.IntegerField(null=True, default=None)

    # Will only be populated for quarterly data
    quarter = models.IntegerField(null=True, default=None)

    agency_name = models.CharField(max_length=255, blank=True)

    interest_earned = models.DecimalField(
        max_digits=30, decimal_places=15, default=Decimal(0)
    )

    miscellaneous_income = models.DecimalField(
        max_digits=30, decimal_places=15, default=Decimal(0)
    )

    def __str__(self):
        agency_str = f" for agency {self.agency_name}" if self.agency_name else ""
        period_str = (
            f"{self.triennial_start_year} - {self.triennial_start_year + 2}"
            if self.triennial_start_year
            else (
                self.year
                if self.quarter is None
                else f"{self.year} quarter {self.quarter}"
            )
        )
        return (
            f"External Income{agency_str} ({period_str}): "
            f"interest {self.interest_earned}; "
            f"miscellaneous {self.miscellaneous_income}"
        )


class ExternalAllocation(models.Model):
    # This one will be set to True only for initially-imported data!
    is_legacy = models.BooleanField(default=False)

    undp = models.DecimalField(max_digits=30, decimal_places=15, default=Decimal(0))
    unep = models.DecimalField(max_digits=30, decimal_places=15, default=Decimal(0))
    unido = models.DecimalField(max_digits=30, decimal_places=15, default=Decimal(0))
    world_bank = models.DecimalField(
        max_digits=30, decimal_places=15, default=Decimal(0)
    )
    staff_contracts = models.DecimalField(
        max_digits=30, decimal_places=15, default=Decimal(0)
    )
    treasury_fees = models.DecimalField(
        max_digits=30, decimal_places=15, default=Decimal(0)
    )
    monitoring_fees = models.DecimalField(
        max_digits=30, decimal_places=15, default=Decimal(0)
    )
    technical_audit = models.DecimalField(
        max_digits=30, decimal_places=15, default=Decimal(0)
    )
    information_strategy = models.DecimalField(
        max_digits=30, decimal_places=15, default=Decimal(0)
    )

    # This is the year that the data was entered in.
    # It should only be null for legacy entries.
    year = models.IntegerField(null=True)

    meeting = models.ForeignKey(Meeting, null=True, on_delete=models.PROTECT)

    decision_number = models.CharField(max_length=32, default="")

    comment = models.TextField(blank=True, default="")


class StatusOfTheFundFile(models.Model):
    """
    Files uploaded via the Status of the Fund interface.
    """

    def upload_path(self, filename):
        return f"status_of_the_fund_files/{self.id}__{filename}"

    year = models.IntegerField(null=True)

    meeting = models.ForeignKey(Meeting, null=True, on_delete=models.PROTECT)

    comment = models.TextField(blank=True, default="")

    uploaded_at = models.DateTimeField(
        auto_now_add=True, help_text="Date of file upload"
    )
    filename = models.CharField(max_length=128)
    file = models.FileField(storage=get_protected_storage, upload_to=upload_path)

    def file_link(self):
        if self.file:
            url = reverse("replenishment-status-files-detail", args=(self.id,))
            return format_html(f"<a href='{url}'>download</a>")

        return "No attachment"

    file_link.allow_tags = True
