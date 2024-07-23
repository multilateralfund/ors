from django.urls import reverse
from rest_framework import serializers

from core.api.serializers.country import CountrySerializer
from core.models import (
    Country,
    Invoice,
    InvoiceFile,
    Payment,
    PaymentFile,
    Replenishment,
    ScaleOfAssessment,
)


class ReplenishmentSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )

    class Meta:
        model = Replenishment
        fields = "__all__"


class ScaleOfAssessmentSerializer(serializers.ModelSerializer):
    replenishment = ReplenishmentSerializer(read_only=True)
    country = CountrySerializer(read_only=True)
    currency = serializers.CharField()
    exchange_rate = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    bilateral_assistance_amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    un_scale_of_assessment = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    override_adjusted_scale_of_assessment = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    average_inflation_rate = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    override_qualifies_for_fixed_rate_mechanism = serializers.BooleanField()

    adjusted_scale_of_assessment = serializers.ReadOnlyField()
    qualifies_for_fixed_rate_mechanism = serializers.ReadOnlyField()
    amount = serializers.ReadOnlyField()
    amount_local_currency = serializers.ReadOnlyField()

    class Meta:
        model = ScaleOfAssessment
        fields = "__all__"


class InvoiceFileSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = InvoiceFile
        fields = [
            "id",
            "filename",
            "file_type",
            "download_url",
        ]

    def get_download_url(self, obj):
        return reverse("replenishment-invoice-file-download", args=(obj.id,))


class InvoiceSerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)

    replenishment = ReplenishmentSerializer(read_only=True)

    amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    currency = serializers.CharField()
    exchange_rate = serializers.DecimalField(
        max_digits=30, decimal_places=15, allow_null=True, coerce_to_string=False
    )

    number = serializers.ReadOnlyField()

    invoice_files = InvoiceFileSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "country",
            "replenishment",
            "amount",
            "currency",
            "exchange_rate",
            "number",
            "date_of_issuance",
            "date_sent_out",
            "invoice_files",
        ]


class InvoiceCreateSerializer(serializers.ModelSerializer):
    country_id = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    replenishment_id = serializers.PrimaryKeyRelatedField(
        queryset=Replenishment.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    currency = serializers.CharField()
    exchange_rate = serializers.DecimalField(
        max_digits=30, decimal_places=15, allow_null=True, coerce_to_string=False
    )

    number = serializers.CharField()

    class Meta:
        model = Invoice
        fields = [
            "country_id",
            "replenishment_id",
            "amount",
            "currency",
            "exchange_rate",
            "number",
            "date_of_issuance",
            "date_sent_out",
        ]


class PaymentFileSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PaymentFile
        fields = [
            "id",
            "filename",
            "file_type",
            "download_url",
        ]

    def get_download_url(self, obj):
        return reverse("replenishment-payment-file-download", args=(obj.id,))


class PaymentSerializer(serializers.ModelSerializer):
    country_id = CountrySerializer(read_only=True)
    replenishment_id = ReplenishmentSerializer(read_only=True)

    gain_or_loss = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    amount_local_currency = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    amount_usd = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )

    payment_files = PaymentFileSerializer(many=True, read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "country_id",
            "replenishment_id",
            "date",
            "payment_for_year",
            "gain_or_loss",
            "amount_local_currency",
            "amount_usd",
            "payment_files",
        ]
