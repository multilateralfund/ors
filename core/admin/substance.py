from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.substance import Substance, SubstanceAltName


@admin.register(SubstanceAltName)
class SubstanceAltNameAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "substance__name",
    ]

    def get_list_display(self, request):
        return get_final_display_list(SubstanceAltName, [])


@admin.register(Substance)
class SubstanceAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "formula",
    ]

    def get_list_display(self, request):
        exclude = [
            "blendcomponents",
            "price",
            "countryprogrammerecord",
            "substancealtname",
            "excludedusage",
            "excluded_usages",
            "admrecord",
        ]
        return get_final_display_list(Substance, exclude)
