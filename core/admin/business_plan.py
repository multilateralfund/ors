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
        "agencies__name",
    ]
    list_filter = ["status", "agencies"]
    autocomplete_fields = ["agencies"]

    def get_list_display(self, request):
        exclude = ["bprecord", "agencies"]
        return ["agency_names"] + get_final_display_list(BusinessPlan, exclude)

    @admin.display(description="Agencies")
    def agency_names(self, obj):
        return obj.agency_names

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("agencies")


@admin.register(BPRecord)
class BPRecordAdmin(admin.ModelAdmin):
    search_fields = [
        "title",
    ]

    def get_list_display(self, request):
        exclude = ["values"]
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
