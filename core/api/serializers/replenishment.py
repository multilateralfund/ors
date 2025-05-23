from decimal import Decimal, InvalidOperation
from django.urls import reverse
from drf_spectacular.utils import extend_schema_field
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
    BilateralAssistance,
    StatusOfTheFundFile,
)


class ScaleOfAssessmentVersionSerializer(serializers.ModelSerializer):
    version = serializers.IntegerField(read_only=True)

    decision_pdf_download_url = serializers.SerializerMethodField()

    class Meta:
        model = ScaleOfAssessmentVersion
        fields = "__all__"

    def get_decision_pdf_download_url(self, obj):
        if not obj.decision_pdf:
            return None
        return reverse("scale-of-assessment-version-file-download", args=(obj.id,))


class ReplenishmentSerializer(serializers.ModelSerializer):
    start_year = serializers.IntegerField(read_only=True)
    end_year = serializers.IntegerField(read_only=True)
    amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False, read_only=True
    )
    scales_of_assessment_versions = ScaleOfAssessmentVersionSerializer(
        many=True, read_only=True
    )

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
        max_digits=30, decimal_places=15, allow_null=True
    )
    bilateral_assistance_amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, required=False
    )
    un_scale_of_assessment = serializers.DecimalField(
        max_digits=30, decimal_places=15, allow_null=True
    )
    override_adjusted_scale_of_assessment = serializers.DecimalField(
        max_digits=30, decimal_places=15, required=False
    )
    average_inflation_rate = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        allow_null=True,
    )
    override_qualifies_for_fixed_rate_mechanism = serializers.BooleanField(
        required=False
    )

    adjusted_scale_of_assessment = serializers.SerializerMethodField()
    qualifies_for_fixed_rate_mechanism = serializers.ReadOnlyField()
    amount = serializers.SerializerMethodField()
    amount_local_currency = serializers.SerializerMethodField()
    yearly_amount = serializers.SerializerMethodField()
    yearly_amount_local_currency = serializers.SerializerMethodField()

    class Meta:
        model = ScaleOfAssessment
        fields = [
            "id",
            "version",
            "replenishment",
            "country",
            "country_id",
            "currency",
            "exchange_rate",
            "bilateral_assistance_amount",
            "un_scale_of_assessment",
            "override_adjusted_scale_of_assessment",
            "average_inflation_rate",
            "override_qualifies_for_fixed_rate_mechanism",
            "opted_for_ferm",
            # Method fields
            "adjusted_scale_of_assessment",
            "qualifies_for_fixed_rate_mechanism",
            "amount",
            "amount_local_currency",
            "yearly_amount",
            "yearly_amount_local_currency",
        ]

    def _get_quantized_str_decimal_value(self, decimal_value):
        try:
            quantized_value = decimal_value.quantize(Decimal("0.1") ** 15)
        except InvalidOperation:
            # Quantizing may fail if `decimal_value` does not have enough decimal places
            quantized_value = decimal_value
        return str(quantized_value)

    @extend_schema_field(serializers.CharField)
    def get_adjusted_scale_of_assessment(self, obj):
        if getattr(obj, "adjusted_scale_of_assessment", None) is None:
            return None
        return self._get_quantized_str_decimal_value(obj.adjusted_scale_of_assessment)

    @extend_schema_field(serializers.CharField)
    def get_amount(self, obj):
        if getattr(obj, "amount", None) is None:
            return None
        return self._get_quantized_str_decimal_value(obj.amount)

    @extend_schema_field(serializers.CharField)
    def get_amount_local_currency(self, obj):
        if getattr(obj, "amount_local_currency", None) is None:
            return None
        return self._get_quantized_str_decimal_value(obj.amount_local_currency)

    @extend_schema_field(serializers.CharField)
    def get_yearly_amount(self, obj):
        if getattr(obj, "yearly_amount", None) is None:
            return None
        return self._get_quantized_str_decimal_value(obj.yearly_amount)

    @extend_schema_field(serializers.CharField)
    def get_yearly_amount_local_currency(self, obj):
        if getattr(obj, "yearly_amount_local_currency", None) is None:
            return None
        return self._get_quantized_str_decimal_value(obj.yearly_amount_local_currency)


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
    is_dashboard_only = serializers.BooleanField(required=False, allow_null=True)

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
    decision_number = serializers.CharField(
        allow_null=True, allow_blank=True, required=False
    )

    class Meta:
        model = ExternalAllocation
        fields = [
            "is_legacy",
            "is_dashboard_only",
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
            "decision_number",
        ]


class ExternalIncomeAnnualSerializer(serializers.ModelSerializer):
    triennial_start_year = serializers.IntegerField(required=False, allow_null=True)

    year = serializers.IntegerField(required=False, allow_null=True)

    quarter = serializers.IntegerField(required=False, allow_null=True)

    agency_name = serializers.CharField(required=False, allow_null=True)

    interest_earned = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        required=False,
        allow_null=True,
        coerce_to_string=False,
    )

    miscellaneous_income = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        required=False,
        allow_null=True,
        coerce_to_string=False,
    )

    meeting_id = serializers.PrimaryKeyRelatedField(
        queryset=Meeting.objects.all().values_list("id", flat=True),
        allow_null=True,
        required=False,
    )

    comment = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = ExternalIncomeAnnual
        fields = "__all__"


class BilateralAssistanceCreateSerializer(serializers.ModelSerializer):
    country_id = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all().values_list("id", flat=True),
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
        model = BilateralAssistance
        fields = [
            "country_id",
            "year",
            "amount",
            "meeting_id",
            "decision_number",
            "comment",
        ]


class BilateralAssistanceReadSerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)
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
    comment = serializers.CharField()

    class Meta:
        model = BilateralAssistance
        fields = [
            "id",
            "country",
            "year",
            "amount",
            "meeting_id",
            "decision_number",
            "comment",
        ]


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

    amount_usd = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    amount_local_currency = serializers.DecimalField(
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
            "year",
            "is_ferm",
            "status",
            "amount_usd",
            "amount_local_currency",
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

    is_ferm = serializers.BooleanField(allow_null=True)

    status = serializers.CharField(required=False, allow_null=True)
    amount_usd = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    amount_local_currency = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        required=False,
        allow_null=True,
        coerce_to_string=False,
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
            "is_ferm",
            "year",
            "status",
            "amount_usd",
            "amount_local_currency",
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

    amount_assessed = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    amount_received = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        coerce_to_string=False,
        allow_null=True,
        required=False,
    )

    amount_local_currency = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        coerce_to_string=False,
        allow_null=True,
        required=False,
    )

    exchange_rate = serializers.DecimalField(
        max_digits=30, decimal_places=15, allow_null=True, coerce_to_string=False
    )
    ferm_gain_or_loss = serializers.DecimalField(
        max_digits=30, decimal_places=15, allow_null=True, coerce_to_string=False
    )

    payment_files = PaymentFileSerializer(many=True, read_only=True)
    invoice = InvoiceForPaymentChoicesSerializer(many=False, read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "country",
            "invoice",
            "is_ferm",
            "status",
            "date",
            "payment_for_years",
            "amount_assessed",
            "amount_received",
            "amount_local_currency",
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

    invoice_id = serializers.PrimaryKeyRelatedField(
        queryset=Invoice.objects.all().values_list("id", flat=True),
        many=False,
        write_only=True,
        required=False,
    )
    is_ferm = serializers.BooleanField(allow_null=True)

    status = serializers.CharField(required=False, allow_null=True)

    amount_assessed = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    amount_received = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        coerce_to_string=False,
        allow_null=True,
        required=False,
    )

    amount_local_currency = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        coerce_to_string=False,
        allow_null=True,
        required=False,
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
            "date",
            "payment_for_years",
            "invoice_id",
            "is_ferm",
            "status",
            "amount_assessed",
            "amount_received",
            "amount_local_currency",
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


class StatusOfTheFundFileSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(allow_null=True, required=False)

    meeting_id = serializers.PrimaryKeyRelatedField(
        queryset=Meeting.objects.all().values_list("id", flat=True),
        allow_null=True,
        required=False,
    )

    uploaded_at = serializers.DateTimeField(read_only=True)

    filename = serializers.CharField()

    download_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StatusOfTheFundFile
        fields = [
            "id",
            "year",
            "meeting_id",
            "comment",
            "filename",
            "uploaded_at",
            "download_url",
        ]

    def get_download_url(self, obj):
        return reverse("replenishment-status-files-detail", args=(obj.id,))
