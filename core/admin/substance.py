from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.substance import Substance, SubstanceAltName
from admin_auto_filters.filters import AutocompleteFilterFactory


@admin.register(SubstanceAltName)
class SubstanceAltNameAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "substance__name",
    ]
    autocomplete_fields = ["substance"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("substance")

    def get_list_display(self, request):
        return get_final_display_list(SubstanceAltName, [])


@admin.register(Substance)
class SubstanceAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "formula",
        "description",
    ]
    list_filter = [
        AutocompleteFilterFactory("group", "group"),
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("group")

    def get_list_display(self, request):
        exclude = [
            "blendcomponents",
            "cpprices",
            "cprecord",
            "alt_names",
            "excludedusage",
            "excluded_usages",
            "admrecord",
            "project_ods",
            "projectenterprise_ods",
            "bpactivity",
            "cprecordarchive",
            "cppricesarchive",
            "admrecordarchive",
            "cpreportformatrow",
            "allcprecordsview",
        ]
        return get_final_display_list(Substance, exclude)
