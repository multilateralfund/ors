from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.business_plan import (
    BPChemicalType,
    BusinessPlan,
    BPRecord,
    BPRecordValue,
)


@admin.register(BusinessPlan)
class BusinessPlanAdmin(admin.ModelAdmin):
    search_fields = [
        "agency",
    ]

    def get_list_display(self, request):
        exclude = ["bphistory", "bprecord", "records"]
        return get_final_display_list(BusinessPlan, exclude)


@admin.register(BPRecord)
class BPRecordAdmin(admin.ModelAdmin):
    search_fields = [
        "title",
    ]

    def get_list_display(self, request):
        exclude = ["substances", "blends", "bprecordvalue", "values"]
        return get_final_display_list(BPRecord, exclude)


@admin.register(BPRecordValue)
class BPValueAdmin(admin.ModelAdmin):
    search_fields = [
        "value",
    ]

    def get_list_display(self, request):
        exclude = ["bprecord"]
        return get_final_display_list(BPRecordValue, exclude)


@admin.register(BPChemicalType)
class BPChemicalTypeAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["bprecord"]
        return get_final_display_list(BPChemicalType, exclude)
