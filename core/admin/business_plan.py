from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.business_plan import BPChemicalType, BPValue, BusinessPlan


@admin.register(BusinessPlan)
class BusinessPlanAdmin(admin.ModelAdmin):
    search_fields = [
        "title",
    ]

    def get_list_display(self, request):
        exclude = ["bpvalue"]
        return get_final_display_list(BusinessPlan, exclude)


@admin.register(BPValue)
class BPValueAdmin(admin.ModelAdmin):
    search_fields = [
        "value",
    ]

    def get_list_display(self, request):
        exclude = ["businessplan"]
        return get_final_display_list(BPValue, exclude)


@admin.register(BPChemicalType)
class BPChemicalTypeAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["businessplan"]
        return get_final_display_list(BPChemicalType, exclude)
