from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.models import (
    Replenishment,
    ScaleOfAssessment,
    ScaleOfAssessmentVersion,
    Invoice,
    Payment,
    ExternalAllocation,
    ExternalIncome,
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
