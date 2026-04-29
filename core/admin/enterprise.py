from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.project import (
    Project,
)
from core.models.enterprise import (
    Enterprise,
    EnterpriseOdsOdp,
    EnterpriseStatus,
)


@admin.register(EnterpriseStatus)
class EnterpriseStatusAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]
    list_display = [
        "name",
    ]


@admin.register(Enterprise)
class EnterpriseAdmin(admin.ModelAdmin):
    search_fields = [
        "legacy_code",
        "code",
        "name",
    ]
    readonly_fields = [
        "code",
    ]
    list_display = [
        "legacy_code",
        "code",
        "name",
        "country",
        "agency",
        "meeting",
        "location",
        "stage",
        "sector",
        "subsector",
        "project_type",
        "application",
    ]
    list_filter = [
        AutocompleteFilterFactory("country", "country"),
        AutocompleteFilterFactory("agency", "agency"),
        AutocompleteFilterFactory("status", "status"),
        AutocompleteFilterFactory("meeting", "meeting"),
        AutocompleteFilterFactory("sector", "sector"),
        AutocompleteFilterFactory("subsector", "subsector"),
        AutocompleteFilterFactory("project_type", "project_type"),
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("country")


@admin.register(EnterpriseOdsOdp)
class EnterpriseOdsOdpAdmin(admin.ModelAdmin):
    search_fields = [
        "enterprise__name",
        "ods_substance__name",
        "ods_blend__name",
    ]
    list_display = [
        "enterprise",
        "ods_substance",
        "ods_blend",
        "ods_display_name",
        "consumption",
        "selected_alternative",
        "chemical_phased_in_mt",
    ]
    list_filter = [
        AutocompleteFilterFactory("enterprise", "enterprise"),
        AutocompleteFilterFactory("ods_substance", "ods_substance"),
        AutocompleteFilterFactory("ods_blend", "ods_blend"),
    ]
