from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.country_programme import (
    CPRecord,
    CPReport,
    CPReportFormatColumn,
    CPReportFormatRow,
    CPUsage,
    CPPrices,
    CPGeneration,
    CPEmission,
)


@admin.register(CPReport)
class CPReportAdmin(admin.ModelAdmin):
    search_fields = ["name", "year", "country__name", "reporting_email"]
    list_filter = [
        "status",
        AutocompleteFilterFactory("country", "country"),
        "year",
    ]
    autocomplete_fields = ["country"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("country")

    def get_list_display(self, request):
        exclude = [
            "cprecords",
            "usage",
            "comment",
            "adm_records",
            "adm_rows",
            "prices",
            "cpgenerations",
            "cpemissions",
        ]
        return get_final_display_list(CPReport, exclude)


@admin.register(CPRecord)
class CPRecordAdmin(admin.ModelAdmin):
    list_filter = [
        AutocompleteFilterFactory("country", "country_programme_report__country"),
        AutocompleteFilterFactory("blend", "blend"),
        AutocompleteFilterFactory("substance", "substance"),
        "country_programme_report__year",
    ]
    search_fields = [
        "country_programme_report__name",
    ]
    readonly_fields = ["country_programme_report"]
    autocomplete_fields = ["blend", "substance"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related(
            "blend", "substance", "country_programme_report__country"
        )

    def get_country(self, obj):
        return obj.country_programme_report.country

    get_country.short_description = "Country"

    def get_year(self, obj):
        return obj.country_programme_report.year

    get_year.short_description = "Year"

    def get_list_display(self, request):
        exclude = ["source_file", "cpusage", "record_usages"]
        return get_final_display_list(CPRecord, exclude) + [
            "get_year",
            "get_country",
        ]


@admin.register(CPUsage)
class CPUsageAdmin(admin.ModelAdmin):
    list_filter = [
        AutocompleteFilterFactory(
            "country", "country_programme_record__country_programme_report__country"
        ),
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
        return get_final_display_list(CPUsage, [])


@admin.register(CPPrices)
class CPPricesAdmin(admin.ModelAdmin):
    search_fields = ["country_programme_report__name", "substance__name"]
    list_filter = [
        AutocompleteFilterFactory("country", "country_programme_report__country"),
        AutocompleteFilterFactory("blend", "blend"),
        AutocompleteFilterFactory("substance", "substance"),
        "country_programme_report__year",
    ]
    readonly_fields = ["country_programme_report"]
    autocomplete_fields = ["blend", "substance"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related(
            "blend", "substance", "country_programme_report__country"
        )

    def get_list_display(self, request):
        exclude = ["source_file", "display_name"]
        return get_final_display_list(CPPrices, exclude)


@admin.register(CPGeneration)
class CPGenerationAdmin(admin.ModelAdmin):
    search_fields = ["country_programme_report__name"]
    list_filter = [
        AutocompleteFilterFactory("country", "country_programme_report__country"),
        "country_programme_report__year",
    ]
    readonly_fields = ["country_programme_report"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("country_programme_report__country")

    def get_list_display(self, request):
        exclude = ["source_file"]
        return get_final_display_list(CPGeneration, exclude)


@admin.register(CPEmission)
class CPEmissionAdmin(admin.ModelAdmin):
    search_fields = ["country_programme_report__name"]
    list_filter = [
        AutocompleteFilterFactory("country", "country_programme_report__country"),
        "country_programme_report__year",
    ]
    readonly_fields = ["country_programme_report"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("country_programme_report__country")

    def get_list_display(self, request):
        exclude = ["source_file", "remarks"]
        return get_final_display_list(CPEmission, exclude)


@admin.register(CPReportFormatColumn)
class CPReportFormatColumnAdmin(admin.ModelAdmin):
    search_fields = ["usage__name"]
    list_filter = [
        "section",
        "time_frame",
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("usage", "time_frame")

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(CPReportFormatColumn, exclude)


@admin.register(CPReportFormatRow)
class CPReportFormatRowAdmin(admin.ModelAdmin):
    search_fields = ["substance__name", "blend__name"]
    list_filter = [
        "section",
        "time_frame",
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("substance", "blend", "time_frame")

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(CPReportFormatRow, exclude)
