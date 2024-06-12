from django.db import models

from core.models import Country
from core.models.utils import get_protected_storage


class Replenishment(models.Model):
    start_year = models.IntegerField()
    end_year = models.IntegerField()
    amount = models.DecimalField(max_digits=20, decimal_places=5)

    def __str__(self):
        return f"Replenishment ({self.start_year} - {self.end_year})"


class Contribution(models.Model):
    replenishment = models.ForeignKey(
        Replenishment,
        on_delete=models.PROTECT,
        null=True,
        related_name="contributions",
    )
    country = models.ForeignKey(
        Country, on_delete=models.PROTECT, null=True, related_name="contributions"
    )
    paid_in_local_currency = models.BooleanField(default=False)
    amount = models.DecimalField(max_digits=20, decimal_places=5)
    currency_of_payment = models.CharField(max_length=16)
    exchange_rate_six_months_prior = models.DecimalField(
        max_digits=20, decimal_places=5
    )
    bilateral_assistance_amount = models.DecimalField(
        max_digits=20, decimal_places=5, default=0
    )
    un_scale_of_assessment = models.DecimalField(max_digits=20, decimal_places=5)
    edited_scale_of_assessment = models.DecimalField(
        max_digits=20, decimal_places=5, null=True
    )
    average_contributor_inflation_rate = models.DecimalField(
        max_digits=20, decimal_places=5
    )
    edited_qualifies_for_fixed_rate_mechanism = models.BooleanField(default=False)

    @property
    def adjusted_scale_of_assessment(self):
        # TODO: formula
        return self.edited_scale_of_assessment or 0

    @property
    def qualifies_for_fixed_rate_mechanism(self):
        # TODO: formula
        return self.edited_qualifies_for_fixed_rate_mechanism or 0

    def __str__(self):
        return f"Contribution {self.country.name} ({self.replenishment.start_year} - {self.replenishment.end_year})"


class Invoice(models.Model):
    country = models.ForeignKey(
        Country, on_delete=models.PROTECT, null=True, related_name="invoices"
    )
    replenishment = models.ForeignKey(
        Replenishment, on_delete=models.PROTECT, null=True, related_name="invoices"
    )
    amount = models.DecimalField(max_digits=20, decimal_places=5)
    date = models.DateField()
    number = models.CharField(max_length=128, unique=True)

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
        Country, on_delete=models.PROTECT, null=True, related_name="payments"
    )
    replenishment = models.ForeignKey(
        Replenishment, on_delete=models.PROTECT, null=True, related_name="payments"
    )
    date = models.DateField()
    payment_for_year = models.CharField(max_length=16)
    gain_or_loss = models.DecimalField(max_digits=20, decimal_places=5)
    amount_local_currency = models.DecimalField(max_digits=20, decimal_places=5)
    amount_usd = models.DecimalField(max_digits=20, decimal_places=5)

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
