from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.adm import AdmColumn, AdmRecord, AdmRow, AdmChoice


@admin.register(AdmColumn)
class AdmColumnAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["admrecord"]
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
        "country_programme_report__year",
    ]

    def get_list_display(self, request):
        return get_final_display_list(AdmRecord, [])


@admin.register(AdmRow)
class AdmRowAdmin(admin.ModelAdmin):
    search_fields = [
        "text",
        "index",
    ]
    list_filter = ["type"]

    def get_list_display(self, request):
        exclude = [
            "admrecord",
            "children",
            "admchoice",
        ]
        return get_final_display_list(AdmRow, exclude)


@admin.register(AdmChoice)
class AdmChoiceAdmin(admin.ModelAdmin):
    search_fields = [
        "value",
    ]

    def get_list_display(self, request):
        exclude = ["admrecord"]
        return get_final_display_list(AdmChoice, exclude)
