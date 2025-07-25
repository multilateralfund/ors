from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.business_plan import (
    BPChemicalType,
    BusinessPlan,
    BPActivity,
    BPActivityValue,
)


@admin.register(BusinessPlan)
class BusinessPlanAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        exclude = ["bphistory", "bpactivity", "activities"]
        return get_final_display_list(BusinessPlan, exclude)


@admin.register(BPActivity)
class BPActivityAdmin(admin.ModelAdmin):
    search_fields = ["title", "business_plan__name"]
    list_filter = [
        AutocompleteFilterFactory("project_cluster", "project_cluster"),
        AutocompleteFilterFactory("country", "country"),
        AutocompleteFilterFactory("agency", "agency"),
        "business_plan",
    ]

    def get_list_display(self, request):
        exclude = ["substances", "bpactivityvalue", "values", "projects"]
        return get_final_display_list(BPActivity, exclude)


@admin.register(BPActivityValue)
class BPValueAdmin(admin.ModelAdmin):
    search_fields = [
        "value",
    ]

    def get_list_display(self, request):
        exclude = ["bpactivity"]
        return get_final_display_list(BPActivityValue, exclude)


@admin.register(BPChemicalType)
class BPChemicalTypeAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]
    list_filter = [
        "obsolete",
    ]

    def get_list_display(self, request):
        exclude = ["bpactivity"]
        return get_final_display_list(BPChemicalType, exclude)
