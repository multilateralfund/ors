from django.db import models
from django.utils.functional import cached_property

from core.models import Country


class Replenishment(models.Model):
    start_year = models.IntegerField()
    end_year = models.IntegerField()
    amount = models.DecimalField(max_digits=20, decimal_places=6)


class Contribution(models.Model):
    replenishment = models.ForeignKey(
        Replenishment,
        on_delete=models.SET_NULL,
        null=True,
        related_name="contributions",
    )
    contributor = models.ForeignKey(
        Country, on_delete=models.SET_NULL, null=True, related_name="contributions"
    )
    paid_in_local_currency = models.BooleanField(default=False)
    amount = models.DecimalField(max_digits=20, decimal_places=6)
    currency_of_payment = models.CharField(max_length=16)
    exchange_rate_six_months_prior = models.DecimalField(
        max_digits=20, decimal_places=6
    )
    bilateral_assistance_amount = models.DecimalField(
        max_digits=20, decimal_places=6, default=0
    )
    un_scale_of_assessment = models.DecimalField(max_digits=20, decimal_places=6)
    overridden_scale_of_assessment = models.DecimalField(
        max_digits=20, decimal_places=6, null=True
    )
    average_contributor_inflation_rate = models.DecimalField(
        max_digits=20, decimal_places=6
    )
    qualifies_for_fixed_rate_mechanism = models.BooleanField(default=False)

    @cached_property
    def adjusted_scale_of_assessment(self):
        return self.overridden_scale_of_assessment or 0


class Invoice(models.Model):
    country = models.ForeignKey(
        Country, on_delete=models.SET_NULL, null=True, related_name="invoices"
    )
    replenishment = models.ForeignKey(
        Replenishment, on_delete=models.SET_NULL, null=True, related_name="invoices"
    )
    date = models.DateField()
    number = models.CharField(max_length=128, unique=True)


class InvoiceFile(models.Model):
    def upload_path(self, filename):
        return f"invoice_files/{self.invoice.country}/{self.invoice.number}__{filename}"

    uploaded_at = models.DateTimeField(
        auto_now_add=True, help_text="Date of invoice file upload"
    )
    invoice = models.ForeignKey(
        Invoice, on_delete=models.CASCADE, related_name="invoice_files"
    )
    filename = models.CharField(max_length=128)
    file = models.FileField(upload_to=upload_path)


class Payment(models.Model):
    country = models.ForeignKey(
        Country, on_delete=models.SET_NULL, null=True, related_name="payments"
    )
    replenishment = models.ForeignKey(
        Replenishment, on_delete=models.SET_NULL, null=True, related_name="payments"
    )
    date = models.DateField()
    payment_for_year = models.CharField(max_length=16)
    gain_or_loss = models.DecimalField(max_digits=20, decimal_places=6)
    amount_local_currency = models.DecimalField(max_digits=20, decimal_places=6)
    amount_usd = models.DecimalField(max_digits=20, decimal_places=6)


class PaymentFile(models.Model):
    def upload_path(self, filename):
        return f"payment_files/{self.payment.country}/{self.payment.id}__{filename}"

    uploaded_at = models.DateTimeField(
        auto_now_add=True, help_text="Date of payment file upload"
    )
    payment = models.ForeignKey(
        Payment, on_delete=models.CASCADE, related_name="payment_files"
    )
    filename = models.CharField(max_length=128)
    file = models.FileField(upload_to=upload_path)


class PromissoryNoteFile(models.Model):
    def upload_path(self, filename):
        return f"promissory_note_files/{self.payment.country}/{self.payment.id}__{filename}"

    uploaded_at = models.DateTimeField(
        auto_now_add=True, help_text="Date of promissory note file upload"
    )
    payment = models.ForeignKey(
        Payment, on_delete=models.CASCADE, related_name="promissory_note_files"
    )
    filename = models.CharField(max_length=128)
    file = models.FileField(upload_to=upload_path)
