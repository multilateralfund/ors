from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.country import Country


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
        exclude = [
            "cpreport",
            "project",
            "bprecord",
            "cpreportarchive",
            "country",
            "user",
            "cpfiles",
        ]
        return get_final_display_list(Country, exclude)
