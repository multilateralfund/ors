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
    ScaleOfAssessmentVersion,
    DisputedContribution,
)


class ScaleOfAssessmentVersionSerializer(serializers.ModelSerializer):
    version = serializers.IntegerField(read_only=True)

    class Meta:
        model = ScaleOfAssessmentVersion
        fields = "__all__"


class ReplenishmentSerializer(serializers.ModelSerializer):
    start_year = serializers.IntegerField(read_only=True)
    end_year = serializers.IntegerField(read_only=True)
    amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    scales_of_assessment_versions = serializers.SerializerMethodField()

    def get_scales_of_assessment_versions(self, obj):
        qs = obj.scales_of_assessment_versions.order_by("-version")
        return ScaleOfAssessmentVersionSerializer(qs, many=True).data

    class Meta:
        model = Replenishment
        fields = "__all__"


class ScaleOfAssessmentSerializer(serializers.ModelSerializer):
    version = ScaleOfAssessmentVersionSerializer(read_only=True)
    replenishment = ReplenishmentSerializer(
        source="version.replenishment", read_only=True
    )
    country = CountrySerializer(read_only=True)
    country_id = serializers.PrimaryKeyRelatedField(
        source="country", queryset=Country.objects.all(), write_only=True
    )
    currency = serializers.CharField(allow_blank=True, required=False)
    exchange_rate = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False, allow_null=True
    )
    bilateral_assistance_amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False, required=False
    )
    un_scale_of_assessment = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    override_adjusted_scale_of_assessment = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False, required=False
    )
    average_inflation_rate = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        coerce_to_string=False,
        allow_null=True,
    )
    override_qualifies_for_fixed_rate_mechanism = serializers.BooleanField(
        required=False
    )

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
        max_digits=30,
        decimal_places=15,
        allow_null=True,
        required=False,
        coerce_to_string=False,
    )

    number = serializers.CharField()

    date_sent_out = serializers.DateField(allow_null=True, required=False)

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
    country = CountrySerializer(read_only=True)
    replenishment = ReplenishmentSerializer(read_only=True, allow_null=True)

    amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    exchange_rate = serializers.DecimalField(
        max_digits=30, decimal_places=15, allow_null=True, coerce_to_string=False
    )
    ferm_gain_or_loss = serializers.DecimalField(
        max_digits=30, decimal_places=15, allow_null=True, coerce_to_string=False
    )

    payment_files = PaymentFileSerializer(many=True, read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "country",
            "replenishment",
            "date",
            "payment_for_year",
            "amount",
            "currency",
            "exchange_rate",
            "ferm_gain_or_loss",
            "comment",
            "payment_files",
        ]


class PaymentCreateSerializer(serializers.ModelSerializer):
    country_id = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    replenishment_id = serializers.PrimaryKeyRelatedField(
        queryset=Replenishment.objects.all().values_list("id", flat=True),
        write_only=True,
        allow_null=True,
        required=False,
    )

    amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    exchange_rate = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        allow_null=True,
        required=False,
        coerce_to_string=False,
    )
    ferm_gain_or_loss = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        allow_null=True,
        required=False,
        coerce_to_string=False,
    )

    class Meta:
        model = Payment
        fields = [
            "country_id",
            "replenishment_id",
            "date",
            "payment_for_year",
            "amount",
            "currency",
            "exchange_rate",
            "ferm_gain_or_loss",
            "comment",
        ]


class DisputedContributionReadSerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)
    year = serializers.IntegerField()
    amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    comment = serializers.CharField()

    class Meta:
        model = DisputedContribution
        fields = [
            "id",
            "country",
            "year",
            "amount",
            "comment",
        ]


class DisputedContributionCreateSerializer(serializers.ModelSerializer):
    country = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all(),
        write_only=True,
    )
    year = serializers.IntegerField()
    amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    comment = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = DisputedContribution
        fields = [
            "id",
            "country",
            "year",
            "amount",
            "comment",
        ]
