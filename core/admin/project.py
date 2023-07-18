from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.project import (
    Project,
    ProjectSector,
    ProjectStatus,
    ProjectSubSector,
    ProjectType,
)


@admin.register(ProjectSector)
class ProjectSectorAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["projectsubsector"]
        return get_final_display_list(ProjectSector, exclude)


@admin.register(ProjectSubSector)
class ProjectSubSectorAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]
    list_filter = [
        "sector",
    ]
    autocomplete_fields = ["sector"]

    def get_list_display(self, request):
        exclude = ["project"]
        return get_final_display_list(ProjectSubSector, exclude)


@admin.register(ProjectType)
class ProjectTypeAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["project"]
        return get_final_display_list(ProjectType, exclude)


@admin.register(ProjectStatus)
class ProjectStatusAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["project"]
        return get_final_display_list(ProjectStatus, exclude)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    search_fields = [
        "title",
    ]
    list_filter = [
        "project_type",
        "agency",
        "subsector",
    ]
    autocomplete_fields = ["country", "subsector", "agency"]

    def get_list_display(self, request):
        exclude = ["projectsubmission", "projectodsodp", "projectfund"]
        return get_final_display_list(Project, exclude)
