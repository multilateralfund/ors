from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.project import (
    Project,
)
from core.models.project_enterprise import (
    Enterprise,
    ProjectEnterprise,
    ProjectEnterpriseOdsOdp,
)


@admin.register(Enterprise)
class EnterpriseAdmin(admin.ModelAdmin):
    search_fields = [
        "code",
        "name",
        "country__name",
        "location",
        "application",
    ]
    readonly_fields = [
        "code",
    ]
    list_filter = [
        AutocompleteFilterFactory("country", "country"),
    ]

    def get_list_display(self, request):
        exclude = [
            "project_enterprises",
        ]
        data = get_final_display_list(Enterprise, exclude)
        return data


@admin.register(ProjectEnterprise)
class ProjectEnterpriseAdmin(admin.ModelAdmin):
    list_filter = [
        AutocompleteFilterFactory("project", "project"),
        "status",
    ]
    search_fields = [
        "project__title",
    ]
    raw_id_fields = ["project"]

    def get_list_display(self, request):
        exclude = [
            "ods_odp",
            "project",
        ]
        data = get_final_display_list(ProjectEnterprise, exclude)
        return data

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "project":
            # Use Project.objects.really_all() to include all projects
            kwargs["queryset"] = Project.objects.really_all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(ProjectEnterpriseOdsOdp)
class ProjectEnterpriseOdsOdpAdmin(admin.ModelAdmin):
    search_fields = [
        "project_enterprise__project__title",
    ]
    list_filter = [
        AutocompleteFilterFactory("ods_substance", "ods_substance"),
        AutocompleteFilterFactory(
            "project_enterprise__project", "project_enterprise__project"
        ),
    ]

    def get_list_display(self, request):
        exclude = [""]
        return get_final_display_list(ProjectEnterpriseOdsOdp, exclude)
