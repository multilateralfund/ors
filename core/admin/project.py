from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.meeting import Meeting
from core.models.project import (
    MetaProject,
    Project,
    ProjectCluster,
    ProjectFund,
    ProjectOdsOdp,
    ProjectSector,
    ProjectStatus,
    ProjectSubSector,
    ProjectType,
    SubmissionAmount,
)
from core.models.project import ProjectComment
from core.models.project import ProjectFile
from core.models.project import ProjectProgressReport
from core.models.rbm_measures import RBMMeasure


@admin.register(MetaProject)
class MetaProjectAdmin(admin.ModelAdmin):
    search_fields = [
        "project__title",
    ]
    list_filter = [
        "type",
    ]

    def get_list_display(self, request):
        exclude = ["project", "pcractivity", "pcrlearnedlessons", "pcrdelayexplanation"]
        return get_final_display_list(MetaProject, exclude)


@admin.register(ProjectSector)
class ProjectSectorAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["projectsubsector", "bprecord", "project"]
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
        exclude = ["project", "bprecord"]
        return get_final_display_list(ProjectSubSector, exclude)


@admin.register(ProjectType)
class ProjectTypeAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["project", "businessplan", "bprecord"]
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
        AutocompleteFilterFactory("agency", "agency"),
        AutocompleteFilterFactory("sector", "sector"),
        AutocompleteFilterFactory("subsector", "subsector"),
        AutocompleteFilterFactory("project_type", "project_type"),
        AutocompleteFilterFactory("cluster", "cluster"),
        "substance_type",
        "meta_project__type",
        "status",
    ]
    autocomplete_fields = ["country", "sector", "subsector", "agency", "project_type"]

    def get_list_display(self, request):
        exclude = [
            "progress_reports",
            "projectsubmission",
            "ods_odp",
            "funds",
            "submission",
            "files",
            "comments",
            "submission_amounts",
            "rbm_measures",
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


@admin.register(SubmissionAmount)
class SubmissionAmountAdmin(admin.ModelAdmin):
    search_fields = [
        "project__title",
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("project")

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(SubmissionAmount, exclude)


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    search_fields = [
        "number",
    ]

    def get_list_display(self, request):
        exclude = [
            "project",
            "decision",
            "projectfund",
            "approved_projects",
            "transferred_projects",
        ]
        return get_final_display_list(Meeting, exclude)


@admin.register(ProjectCluster)
class ProjectClusterAdmin(admin.ModelAdmin):
    search_fields = ["name", "code"]

    def get_list_display(self, request):
        exclude = ["project", "bprecord"]
        return get_final_display_list(ProjectCluster, exclude)


@admin.register(RBMMeasure)
class RBMMeasureAdmin(admin.ModelAdmin):
    search_fields = ["name"]

    def get_list_display(self, request):
        exclude = ["project_measures"]
        return get_final_display_list(RBMMeasure, exclude)
