from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.models import (
    Replenishment,
    ScaleOfAssessment,
    ScaleOfAssessmentVersion,
    Invoice,
    Payment,
    ExternalAllocation,
    ExternalIncomeAnnual,
    DisputedContribution,
    AnnualContributionStatus,
    TriennialContributionStatus,
    InvoiceFile,
    PaymentFile,
    StatusOfTheFundFile,
)


@admin.register(Replenishment)
class ReplenishmentAdmin(admin.ModelAdmin):
    search_fields = [
        "start_year",
        "end_year",
        "amount",
    ]
    list_filter = ["start_year", "end_year", "amount"]


@admin.register(ScaleOfAssessment)
class ScaleOfAssessmentAdmin(admin.ModelAdmin):
    search_fields = [
        "country__name",
        "version__replenishment__start_year",
        "version__replenishment__end_year",
        "opted_for_ferm",
    ]
    list_filter = [
        AutocompleteFilterFactory("country", "country"),
        AutocompleteFilterFactory("replenishment", "version__replenishment"),
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("country", "version")


@admin.register(ScaleOfAssessmentVersion)
class ScaleOfAssessmentVersionAdmin(admin.ModelAdmin):
    search_fields = [
        "replenishment__start_year",
        "replenishment__end_year",
        "version",
        "meeting_number",
        "decision_number",
        "comment",
    ]
    list_filter = [
        AutocompleteFilterFactory("replenishment", "replenishment"),
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("replenishment")

    def get_list_display(self, request):
        return [
            "__str__",
            "version",
            "is_final",
            "meeting_number",
            "decision_number",
            "decision_pdf",
            "comment",
        ]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    search_fields = [
        "country__name",
        "date_of_issuance",
        "number",
    ]
    list_filter = [
        "date_of_issuance",
        AutocompleteFilterFactory("country", "country"),
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("country")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    search_fields = [
        "country__name",
        "date",
        "payment_for_years",
    ]
    list_filter = [
        "date",
        AutocompleteFilterFactory("country", "country"),
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("country")


@admin.register(ExternalAllocation)
class ExternalAllocationAdmin(admin.ModelAdmin):
    search_fields = [
        "year",
        "meeting",
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("meeting")

    def get_list_display(self, request):
        return [
            "id",
            "meeting",
            "decision_number",
            "undp",
            "unep",
            "unido",
            "world_bank",
            "comment",
        ]


@admin.register(ExternalIncomeAnnual)
class ExternalIncomeAnnualAdmin(admin.ModelAdmin):
    search_fields = [
        "agency_name",
        "year",
        "triennial_start_year",
    ]

    def get_list_display(self, request):
        return [
            "__str__",
            "agency_name",
            "quarter",
            "year",
            "triennial_start_year",
        ]


@admin.register(DisputedContribution)
class DisputedContributionAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return [
            "__str__",
            "country",
            "year",
            "amount",
        ]


@admin.register(AnnualContributionStatus)
class AnnualContributionStatusAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return [
            "id",
            "country",
            "year",
            "agreed_contributions",
            "cash_payments",
            "bilateral_assistance",
            "promissory_notes",
            "outstanding_contributions",
            "bilateral_assistance_meeting",
            "bilateral_assistance_decision_number",
        ]


@admin.register(TriennialContributionStatus)
class TriennialContributionStatusAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return [
            "id",
            "country",
            "start_year",
            "end_year",
            "agreed_contributions",
            "cash_payments",
            "bilateral_assistance",
            "promissory_notes",
            "outstanding_contributions",
            "bilateral_assistance_meeting",
            "bilateral_assistance_decision_number",
        ]


@admin.register(InvoiceFile)
class InvoiceFileAdmin(admin.ModelAdmin):
    list_display = ["invoice", "filename", "uploaded_at", "file_link"]
    readonly_fields = ["invoice", "filename", "uploaded_at", "file_link"]


@admin.register(PaymentFile)
class PaymentFileAdmin(admin.ModelAdmin):
    list_display = ["payment", "filename", "uploaded_at", "file_link"]
    readonly_fields = ["payment", "filename", "uploaded_at", "file_link"]


@admin.register(StatusOfTheFundFile)
class StatusOfTheFundFileAdmin(admin.ModelAdmin):
    list_display = ["filename", "year", "meeting", "uploaded_at", "file_link"]
    readonly_fields = [
        "filename",
        "year",
        "meeting",
        "comment",
        "uploaded_at",
        "file_link",
    ]
