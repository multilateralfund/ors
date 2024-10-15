from django.urls import reverse
from rest_framework import serializers

from core.api.serializers.country import CountrySerializer
from core.models import (
    Country,
    Invoice,
    InvoiceFile,
    Meeting,
    Payment,
    PaymentFile,
    Replenishment,
    ScaleOfAssessment,
    ScaleOfAssessmentVersion,
    DisputedContribution,
    ExternalAllocation,
    ExternalIncomeAnnual,
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
        max_digits=30, decimal_places=15, coerce_to_string=False, read_only=True
    )
    scales_of_assessment_versions = serializers.SerializerMethodField()

    def get_scales_of_assessment_versions(self, obj):
        qs = obj.scales_of_assessment_versions.all()
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
        max_digits=30, decimal_places=15, coerce_to_string=False, allow_null=True
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
    yearly_amount = serializers.ReadOnlyField()
    yearly_amount_local_currency = serializers.ReadOnlyField()

    class Meta:
        model = ScaleOfAssessment
        fields = "__all__"


class ScaleOfAssessmentExcelExportSerializer(serializers.ModelSerializer):
    country = serializers.CharField(source="country.name", read_only=True)
    un_scale_of_assessment = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    average_inflation_rate = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    exchange_rate = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )

    class Meta:
        model = ScaleOfAssessment
        fields = [
            "country",
            "un_scale_of_assessment",
            "adjusted_scale_of_assessment",
            "yearly_amount",
            "average_inflation_rate",
            "qualifies_for_fixed_rate_mechanism",
            "exchange_rate",
            "currency",
            "yearly_amount_local_currency",
        ]


class ExternalAllocationSerializer(serializers.ModelSerializer):
    is_legacy = serializers.BooleanField(required=False, allow_null=True)

    undp = serializers.DecimalField(
        max_digits=30, decimal_places=15, required=False, allow_null=True
    )
    unep = serializers.DecimalField(
        max_digits=30, decimal_places=15, required=False, allow_null=True
    )
    unido = serializers.DecimalField(
        max_digits=30, decimal_places=15, required=False, allow_null=True
    )
    world_bank = serializers.DecimalField(
        max_digits=30, decimal_places=15, required=False, allow_null=True
    )
    staff_contracts = serializers.DecimalField(
        max_digits=30, decimal_places=15, required=False, allow_null=True
    )
    treasury_fees = serializers.DecimalField(
        max_digits=30, decimal_places=15, required=False, allow_null=True
    )
    monitoring_fees = serializers.DecimalField(
        max_digits=30, decimal_places=15, required=False, allow_null=True
    )
    technical_audit = serializers.DecimalField(
        max_digits=30, decimal_places=15, required=False, allow_null=True
    )
    information_strategy = serializers.DecimalField(
        max_digits=30, decimal_places=15, required=False, allow_null=True
    )

    year = serializers.IntegerField(allow_null=True, required=False)

    meeting_id = serializers.PrimaryKeyRelatedField(
        queryset=Meeting.objects.all().values_list("id", flat=True),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = ExternalAllocation
        fields = [
            "is_legacy",
            "undp",
            "unep",
            "unido",
            "world_bank",
            "staff_contracts",
            "treasury_fees",
            "monitoring_fees",
            "technical_audit",
            "information_strategy",
            "year",
            "meeting_id",
        ]


class ExternalIncomeAnnualSerializer(serializers.ModelSerializer):
    triennial_start_year = serializers.IntegerField(required=False, allow_null=True)

    year = serializers.IntegerField(required=False, allow_null=True)

    quarter = serializers.IntegerField(required=False, allow_null=True)

    agency_name = serializers.CharField(required=False, allow_null=True)

    interest_earned = serializers.DecimalField(
        max_digits=30, decimal_places=15, required=False, allow_null=True
    )

    miscellaneous_income = serializers.DecimalField(
        max_digits=30, decimal_places=15, required=False, allow_null=True
    )

    class Meta:
        model = ExternalIncomeAnnual
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

    is_arrears = serializers.BooleanField(required=False)

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
            "year",
            "is_arrears",
            "is_ferm",
            "status",
            "amount",
            "currency",
            "exchange_rate",
            "number",
            "date_of_issuance",
            "date_sent_out",
            "date_first_reminder",
            "date_second_reminder",
            "date_paid",
            "invoice_files",
        ]


class InvoiceForPaymentChoicesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [
            "id",
            "number",
        ]


class EmptyInvoiceSerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)
    year = serializers.SerializerMethodField()

    def get_year(self, _obj):
        return int(self.context["year"])

    class Meta:
        # An empty invoice is created from SoA
        model = ScaleOfAssessment
        fields = [
            "country",
            "year",
        ]


class InvoiceCreateSerializer(serializers.ModelSerializer):
    country_id = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    is_arrears = serializers.BooleanField(required=False)

    replenishment_id = serializers.PrimaryKeyRelatedField(
        queryset=Replenishment.objects.all().values_list("id", flat=True),
        write_only=True,
        allow_null=True,
        required=False,
    )

    is_ferm = serializers.BooleanField(allow_null=True)

    status = serializers.CharField(required=False, allow_null=True)
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
    date_first_reminder = serializers.DateField(allow_null=True, required=False)
    date_second_reminder = serializers.DateField(allow_null=True, required=False)

    class Meta:
        model = Invoice
        fields = [
            "country_id",
            "replenishment_id",
            "is_ferm",
            "year",
            "is_arrears",
            "status",
            "amount",
            "currency",
            "exchange_rate",
            "number",
            "date_of_issuance",
            "date_sent_out",
            "date_first_reminder",
            "date_second_reminder",
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
    invoices = InvoiceForPaymentChoicesSerializer(many=True, read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "country",
            "replenishment",
            "is_ferm",
            "date",
            "payment_for_years",
            "amount",
            "currency",
            "exchange_rate",
            "ferm_gain_or_loss",
            "comment",
            "payment_files",
            "invoices",
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
    invoices = serializers.PrimaryKeyRelatedField(
        queryset=Invoice.objects.all().values_list("id", flat=True),
        many=True,
        write_only=True,
        required=False,
    )
    is_ferm = serializers.BooleanField(allow_null=True)

    amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    # If not currency is sent, we'll set it to USD
    currency = serializers.CharField(required=False, allow_null=True)

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
            "payment_for_years",
            "is_ferm",
            "amount",
            "currency",
            "exchange_rate",
            "ferm_gain_or_loss",
            "comment",
            "invoices",
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
    meeting_id = serializers.PrimaryKeyRelatedField(
        queryset=Meeting.objects.all().values_list("id", flat=True),
        allow_null=True,
        required=False,
    )
    decision_number = serializers.CharField(
        allow_null=True, allow_blank=True, required=False
    )
    comment = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = DisputedContribution
        fields = [
            "id",
            "country",
            "year",
            "amount",
            "meeting_id",
            "decision_number",
            "comment",
        ]
