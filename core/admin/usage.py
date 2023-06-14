from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.usage import ExcludedUsage, Usage


@admin.register(Usage)
class UsageAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "full_name",
    ]

    def get_list_display(self, request):
        exclude = ["usage", "countryprogrammeusage", "excludedusage", "children"]
        return get_final_display_list(Usage, exclude)


@admin.register(ExcludedUsage)
class ExcludedUsageAdmin(admin.ModelAdmin):
    search_fields = [
        "blend__name",
        "substance__name",
        "usage__name",
    ]

    def get_list_display(self, request):
        return get_final_display_list(ExcludedUsage, [])
