from decimal import Decimal

from django.db import models

from core.models.base import AbstractSingleton
from core.models.country import Country
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

    @property
    def adjusted_scale_of_assessment(self):
        # TODO: Might need to be moved to the serializer and pass un_assessment_sum as context,
        # otherwise it will be computed for each contribution and will be inefficient
        if self.override_adjusted_scale_of_assessment is not None:
            return self.override_adjusted_scale_of_assessment

        if self.country.iso3 == "USA":
            return US_SCALE_OF_ASSESSMENT

        un_assessment_sum = ScaleOfAssessment.objects.filter(
            version=self.version
        ).aggregate(models.Sum("un_scale_of_assessment"))["un_scale_of_assessment__sum"]

        if un_assessment_sum is None:
            return None

        return (
            self.un_scale_of_assessment / (un_assessment_sum - US_SCALE_OF_ASSESSMENT)
        ) * (Decimal("100") - un_assessment_sum) + self.un_scale_of_assessment

    @property
    def qualifies_for_fixed_rate_mechanism(self):
        if self.override_qualifies_for_fixed_rate_mechanism is not None:
            return self.override_qualifies_for_fixed_rate_mechanism
        if self.average_inflation_rate is None:
            return False
        return self.average_inflation_rate < Decimal("10")

    @property
    def amount(self):
        if self.adjusted_scale_of_assessment is None:
            return None

        return (
            self.version.replenishment.amount
            * self.adjusted_scale_of_assessment
            / Decimal("100")
        )

    @property
    def amount_local_currency(self):
        if self.exchange_rate is None:
            return None
        return self.amount * self.exchange_rate

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
    country = models.ForeignKey(
        Country, on_delete=models.PROTECT, related_name="invoices"
    )

    replenishment = models.ForeignKey(
        Replenishment, on_delete=models.PROTECT, null=True, related_name="invoices"
    )

    amount = models.DecimalField(max_digits=30, decimal_places=15)
    currency = models.CharField(max_length=64)
    exchange_rate = models.DecimalField(max_digits=30, decimal_places=15, null=True)

    number = models.CharField(max_length=128, unique=True)
    date_of_issuance = models.DateField()
    date_sent_out = models.DateField(null=True, blank=True)

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


class Payment(models.Model):
    country = models.ForeignKey(
        Country, on_delete=models.PROTECT, related_name="payments"
    )
    replenishment = models.ForeignKey(
        Replenishment, on_delete=models.PROTECT, related_name="payments", null=True
    )
    date = models.DateField()
    payment_for_year = models.CharField(max_length=64)

    amount = models.DecimalField(max_digits=30, decimal_places=15)
    currency = models.CharField(max_length=64)
    exchange_rate = models.DecimalField(max_digits=30, decimal_places=15, null=True)
    ferm_gain_or_loss = models.DecimalField(max_digits=30, decimal_places=15, null=True)

    comment = models.TextField(blank=True)

    def __str__(self):
        return f"Payment {self.country.name} - {self.payment_for_year}"


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
    amount = models.DecimalField(max_digits=30, decimal_places=15, default=0)

    def __str__(self):
        return f"Disputed Contribution {self.year} - {self.amount}"

    class Meta:
        constraints = [
            # Disputed contributions with country should be unique by year and country
            models.UniqueConstraint(
                fields=["country", "year"], name="unique_disputed_country_year"
            ),
            # Disputed contributions without country should be unique by year
            models.UniqueConstraint(
                fields=["year"], condition=models.Q(country=None), name="unique_year"
            ),
        ]


class FermGainLoss(models.Model):
    country = models.OneToOneField(
        Country,
        on_delete=models.PROTECT,
        related_name="ferm_gain_loss",
    )
    amount = models.DecimalField(max_digits=30, decimal_places=15, default=0)

    def __str__(self):
        return f"Ferm Gain/Loss {self.country.iso3} - {self.amount}"


class ExternalIncome(AbstractSingleton):
    interest_earned = models.DecimalField(max_digits=30, decimal_places=15)
    miscellaneous_income = models.DecimalField(max_digits=30, decimal_places=15)


class ExternalAllocation(AbstractSingleton):
    undp = models.DecimalField(max_digits=30, decimal_places=15)
    unep = models.DecimalField(max_digits=30, decimal_places=15)
    unido = models.DecimalField(max_digits=30, decimal_places=15)
    world_bank = models.DecimalField(max_digits=30, decimal_places=15)
    staff_contracts = models.DecimalField(max_digits=30, decimal_places=15)
    treasury_fees = models.DecimalField(max_digits=30, decimal_places=15)
    monitoring_fees = models.DecimalField(max_digits=30, decimal_places=15)
    technical_audit = models.DecimalField(max_digits=30, decimal_places=15)
    information_strategy = models.DecimalField(max_digits=30, decimal_places=15)
