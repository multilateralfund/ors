from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.country import Country, Region, Subregion


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["subregion"]
        return get_final_display_list(Region, exclude)


@admin.register(Subregion)
class SubregionAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]
    list_filter = ["region"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("region")

    def get_list_display(self, request):
        exclude = ["country"]
        return get_final_display_list(Subregion, exclude)


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "name_alt",
        "full_name",
        "iso3",
        "abbr",
        "abbr_alt",
    ]
    list_filter = ["location_type"]

    def get_list_display(self, request):
        exclude = ["cpreport", "project", "bprecord", "cpreportarchive", "country"]
        return get_final_display_list(Country, exclude)
