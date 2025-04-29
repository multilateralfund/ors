from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.country_programme_archive import CPReportArchive, CPUsageArchive


@admin.register(CPReportArchive)
class CPReportArchiveAdmin(admin.ModelAdmin):
    search_fields = ["name", "year", "country__name"]

    list_filter = [
        AutocompleteFilterFactory("country", "country"),
        "year",
    ]
    autocomplete_fields = ["country"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("country")

    def get_list_display(self, request):
        exclude = [
            "cppricesarchive",
            "cpgenerations",
            "cpemissions",
            "cpgenerationarchive",
            "cpemissionarchive",
            "cpreportedsections",
            "cprecords",
            "adm_records",
            "cpcomments",
            "prices",
        ]
        return get_final_display_list(CPReportArchive, exclude)


@admin.register(CPUsageArchive)
class CPUsageArchiveAdmin(admin.ModelAdmin):
    list_filter = [
        AutocompleteFilterFactory(
            "country", "country_programme_record__country_programme_report__country"
        ),
        "country_programme_record__country_programme_report__year",
        AutocompleteFilterFactory("usage", "usage"),
    ]
    search_fields = [
        "usage__name",
        "country_programme_record__country_programme_report__name",
    ]
    readonly_fields = ["country_programme_record"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related(
            "usage",
            "country_programme_record__country_programme_report__country",
            "country_programme_record__substance",
            "country_programme_record__blend",
        )

    def get_list_display(self, request):
        return get_final_display_list(CPUsageArchive, [])
