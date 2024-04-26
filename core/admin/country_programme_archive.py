from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.country_programme_archive import CPReportArchive


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
            "cpgenerationarchive",
            "cpemissionarchive",
            "cprecords",
            "adm_records",
            "cpcomments",
        ]
        return get_final_display_list(CPReportArchive, exclude)
