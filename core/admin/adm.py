from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.adm import (
    AdmColumn,
    AdmEmptyImmutableCell,
    AdmRecord,
    AdmRow,
    AdmChoice,
)


@admin.register(AdmColumn)
class AdmColumnAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]
    list_filter = ["section"]

    def get_list_display(self, request):
        exclude = ["admrecord", "admrecordarchive", "children", "admemptyimmutablecell"]
        return get_final_display_list(AdmColumn, exclude)


@admin.register(AdmRecord)
class AdmRecordAdmin(admin.ModelAdmin):
    search_fields = [
        "country_programme_report__name",
        "row__text",
    ]
    list_filter = [
        "section",
        AutocompleteFilterFactory("country", "country_programme_report__country"),
        AutocompleteFilterFactory("column", "column"),
        AutocompleteFilterFactory("value_choice", "value_choice"),
        "country_programme_report__year",
    ]
    readonly_fields = ["country_programme_report"]
    autocomplete_fields = ["row", "substance", "blend"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related(
            "row",
            "substance",
            "blend",
            "country_programme_report__country",
            "value_choice",
            "column",
        )

    def get_list_display(self, request):
        return get_final_display_list(AdmRecord, [])


@admin.register(AdmRow)
class AdmRowAdmin(admin.ModelAdmin):
    search_fields = [
        "text",
        "index",
    ]
    list_filter = ["type", "section"]
    autocomplete_fields = ["parent"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related(
            "parent",
            "country_programme_report__country",
        )

    def get_list_display(self, request):
        exclude = [
            "admrecord",
            "admrecordarchive",
            "children",
            "choices",
            "admrecordarchive",
            "admemptyimmutablecell",
        ]
        return get_final_display_list(AdmRow, exclude)


@admin.register(AdmChoice)
class AdmChoiceAdmin(admin.ModelAdmin):
    search_fields = [
        "value",
    ]

    def get_list_display(self, request):
        exclude = ["admrecord", "admrecordarchive"]
        return get_final_display_list(AdmChoice, exclude)


@admin.register(AdmEmptyImmutableCell)
class AdmEmptyImmutableCellsAdmin(admin.ModelAdmin):
    search_fields = [
        "row__text",
        "column__name",
    ]
    list_filter = [
        "section",
        AutocompleteFilterFactory("column", "column"),
        AutocompleteFilterFactory("row", "row"),
    ]
    autocomplete_fields = ["row", "column"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related(
            "row",
            "column",
        )

    def get_list_display(self, request):
        return get_final_display_list(AdmEmptyImmutableCell, [])
