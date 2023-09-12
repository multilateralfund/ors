from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.project import (
    Project,
    ProjectFund,
    ProjectOdsOdp,
    ProjectSector,
    ProjectStatus,
    ProjectSubSector,
    ProjectType,
)
from core.models.project import ProjectComment
from core.models.project import ProjectFile
from core.models.project import ProjectProgressReport


@admin.register(ProjectSector)
class ProjectSectorAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["projectsubsector", "businessplan"]
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
        exclude = ["project", "businessplan"]
        return get_final_display_list(ProjectSubSector, exclude)


@admin.register(ProjectType)
class ProjectTypeAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["project", "businessplan"]
        return get_final_display_list(ProjectType, exclude)


@admin.register(ProjectStatus)
class ProjectStatusAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["project"]
        return get_final_display_list(ProjectStatus, exclude)


class ProjectFileInline(admin.TabularInline):
    model = ProjectFile
    extra = 1


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    inlines = [ProjectFileInline]
    search_fields = [
        "title",
        "code",
    ]
    list_filter = [
        "project_type",
        "status",
        "agency",
        "subsector",
    ]
    autocomplete_fields = ["country", "subsector", "agency"]

    def get_list_display(self, request):
        exclude = [
            "progress_reports",
            "projectsubmission",
            "ods_odp",
            "funds",
            "submission",
            "files",
            "comments",
        ]
        return get_final_display_list(Project, exclude)


@admin.register(ProjectProgressReport)
class ProjectProgressReportAdmin(admin.ModelAdmin):
    list_filter = [
        "status",
    ]
    search_fields = [
        "title",
    ]
    list_per_page = 20

    def get_list_display(self, request):
        exclude = ["remarks_1", "remarks_2"]
        return get_final_display_list(ProjectProgressReport, exclude)


@admin.register(ProjectComment)
class ProjectCommentAdmin(admin.ModelAdmin):
    list_filter = []
    search_fields = [
        "project__title",
    ]
    list_per_page = 20

    def get_list_display(self, request):
        exclude = ["source_file"]
        return get_final_display_list(ProjectComment, exclude)


@admin.register(ProjectOdsOdp)
class ProjectOdsOdpAdmin(admin.ModelAdmin):
    search_fields = [
        "project__title",
    ]
    list_filter = [
        "ods_type",
    ]

    def get_list_display(self, request):
        exclude = ["project"]
        return get_final_display_list(ProjectOdsOdp, exclude)


@admin.register(ProjectFund)
class ProjectFundAdmin(admin.ModelAdmin):
    search_fields = [
        "project__title",
    ]
    list_filter = [
        "fund_type",
    ]

    def get_list_display(self, request):
        exclude = ["project"]
        return get_final_display_list(ProjectFund, exclude)
