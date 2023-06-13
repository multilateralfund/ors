from django.contrib import admin
from core.admin.utils import get_final_display_list
from core.models.country_programme import (
    CountryProgrammeRecord,
    CountryProgrammeReport,
    CountryProgrammeUsage,
)

from admin_auto_filters.filters import AutocompleteFilterFactory


@admin.register(CountryProgrammeReport)
class CountryProgrammeReportAdmin(admin.ModelAdmin):
    search_fields = ["name", "year", "country__name"]
    list_filter = [AutocompleteFilterFactory("country", "country"), "year"]

    def get_list_display(self, request):
        exclude = ["price", "countryprogrammerecord", "usage", "comment"]
        return get_final_display_list(CountryProgrammeReport, exclude)


@admin.register(CountryProgrammeRecord)
class CountryProgrammeRecordAdmin(admin.ModelAdmin):
    list_filter = [
        AutocompleteFilterFactory("country", "country_programme_report__country"),
        AutocompleteFilterFactory("blend", "blend"),
        AutocompleteFilterFactory("substance", "substance"),
        "country_programme_report__year",
    ]

    def get_country(self, obj):
        return obj.country_programme_report.country

    get_country.short_description = "Country"

    def get_year(self, obj):
        return obj.country_programme_report.year

    get_year.short_description = "Year"

    def get_list_display(self, request):
        exclude = ["source_file", "countryprogrammeusage", "record_usages"]
        return get_final_display_list(CountryProgrammeRecord, exclude) + [
            "get_year",
            "get_country",
        ]


@admin.register(CountryProgrammeUsage)
class CountryProgrammeUsageAdmin(admin.ModelAdmin):
    list_filter = [
        AutocompleteFilterFactory(
            "country", "country_programme_record__country_programme_report__country"
        ),
        AutocompleteFilterFactory("usage", "usage"),
    ]
    search_fields = [
        "usage__name",
    ]

    def get_list_display(self, request):
        return get_final_display_list(CountryProgrammeUsage, [])
