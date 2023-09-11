from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.blend import Blend, BlendAltName, BlendComponents


@admin.register(Blend)
class BlendAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "composition",
        "composition_alt",
        "other_names",
        "trade_name",
    ]
    list_filter = ["type"]

    def get_list_display(self, request):
        exclude = [
            "blendcomponents",
            "cprecord",
            "blendaltname",
            "excludedusage",
            "excluded_usages",
            "admrecord",
            "cpprices",
            "components",
            "project_ods",
            "businessplan",
        ]
        return get_final_display_list(Blend, exclude)


@admin.register(BlendAltName)
class BlendAltNameAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "blend__name",
    ]
    autocomplete_fields = ["blend"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("blend")

    def get_list_display(self, request):
        return get_final_display_list(BlendAltName, [])


@admin.register(BlendComponents)
class BlendComponentsAdmin(admin.ModelAdmin):
    search_fields = [
        "blend__name",
        "substance__name",
    ]
    autocomplete_fields = ["blend", "substance"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("blend", "substance")

    def get_list_display(self, request):
        return get_final_display_list(BlendComponents, [])
