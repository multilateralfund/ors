from admin_auto_filters.filters import AutocompleteFilterFactory

from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.project_metadata import (
    ProjectCluster,
    ProjectSector,
    ProjectStatus,
    ProjectSubmissionStatus,
    ProjectSubSector,
    ProjectType,
    ProjectField,
    ProjectSpecificFields,
)


@admin.register(ProjectCluster)
class ProjectClusterAdmin(admin.ModelAdmin):
    search_fields = ["name", "code"]

    def get_list_display(self, request):
        exclude = ["project", "bpactivity", "project_specific_fields"]
        return get_final_display_list(ProjectCluster, exclude)


@admin.register(ProjectField)
class ProjectFieldAdmin(admin.ModelAdmin):
    search_fields = [
        "read_field_name",
        "write_field_name",
        "name",
    ]

    def get_list_display(self, request):
        exclude = [
            "project_specific_fields",
        ]
        return get_final_display_list(ProjectField, exclude)


@admin.register(ProjectSpecificFields)
class ProjectSpecificFieldsAdmin(admin.ModelAdmin):
    search_fields = [
        "cluster__name",
        "type__name",
        "sector__name",
    ]
    list_filter = [
        AutocompleteFilterFactory("cluster", "cluster"),
        AutocompleteFilterFactory("type", "type"),
        AutocompleteFilterFactory("sector", "sector"),
        AutocompleteFilterFactory("fields", "fields"),
    ]
    autocomplete_fields = ["cluster", "type", "sector"]

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(ProjectSpecificFields, exclude)


@admin.register(ProjectSector)
class ProjectSectorAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = [
            "projectsubsector",
            "bpactivity",
            "project",
            "project_specific_fields",
        ]
        return get_final_display_list(ProjectSector, exclude)


@admin.register(ProjectStatus)
class ProjectStatusAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["project"]
        return get_final_display_list(ProjectStatus, exclude)


@admin.register(ProjectSubmissionStatus)
class ProjectSubmissionStatusAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["project"]
        return get_final_display_list(ProjectSubmissionStatus, exclude)


@admin.register(ProjectSubSector)
class ProjectSubSectorAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]
    list_filter = [
        AutocompleteFilterFactory("sector", "sector"),
    ]

    def get_list_display(self, request):
        exclude = ["projects", "bpactivity"]
        return get_final_display_list(ProjectSubSector, exclude)


@admin.register(ProjectType)
class ProjectTypeAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = [
            "project",
            "businessplan",
            "bpactivity",
            "project_specific_fields",
        ]
        return get_final_display_list(ProjectType, exclude)
