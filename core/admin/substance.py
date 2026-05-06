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
        return queryset.select_related("group", "created_by")

    def get_list_display(self, request):
        exclude = [
            "admrecord",
            "admrecordarchive",
            "allcprecordsview",
            "alt_names",
            "blendcomponents",
            "bpactivity",
            "cpprices",
            "cppricesarchive",
            "cprecord",
            "cprecordarchive",
            "cpreportformatrow",
            "enterprise_ods",
            "excludedusage",
            "excluded_usages",
            "project_ods",
        ]
        return get_final_display_list(Substance, exclude)
