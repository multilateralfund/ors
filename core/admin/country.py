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
            "bilateral_assistances",
            "cpreport",
            "project",
            "bpactivity",
            "cpreportarchive",
            "country",
            "user",
            "cpfiles",
            "ceit_statuses",
            "invoices",
            "contributions",
            "payments",
            "annual_contributions_status",
            "triennial_contributions_status",
            "triennialcontributionview",
            "ferm_gain_loss",
            "disputed_contributions",
            "finalreportsview",
        ]
        fields = get_final_display_list(Country, exclude)
        return fields
