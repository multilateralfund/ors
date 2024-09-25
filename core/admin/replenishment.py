from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.models import Replenishment, ScaleOfAssessment, Invoice, Payment


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
        "amount",
    ]
    list_filter = [
        AutocompleteFilterFactory("country", "country"),
        AutocompleteFilterFactory("replenishment", "version__replenishment"),
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("country", "version")


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
        AutocompleteFilterFactory("replenishment", "replenishment"),
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("country", "replenishment")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    search_fields = [
        "country__name",
        "date",
        "payment_for_year",
    ]
    list_filter = [
        "date",
        AutocompleteFilterFactory("country", "country"),
        AutocompleteFilterFactory("replenishment", "replenishment"),
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("country", "replenishment")
