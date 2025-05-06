from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.meeting import Decision, Meeting
from core.models.project import (
    MetaProject,
    Project,
    ProjectComment,
    ProjectFile,
    ProjectFund,
    ProjectOdsOdp,
    ProjectProgressReport,
    ProjectRBMMeasure,
    SubmissionAmount,
)
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
        "submission_status",
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
            "projects",
            "transferred_projects",
            "projectcomment",
            "annualcontributionstatus",
            "triennialcontributionstatus",
            "disputedcontribution",
            "externalallocation",
            "externalincomeannual",
            "statusofthefundfile",
            "businessplan",
            "triennialcontributionview",
        ]
        return get_final_display_list(Meeting, exclude)


@admin.register(Decision)
class DecisionAdmin(admin.ModelAdmin):
    search_fields = ["number"]

    def get_list_display(self, request):
        exclude = [
            "project",
            "businessplan",
        ]
        return get_final_display_list(Decision, exclude)


@admin.register(RBMMeasure)
class RBMMeasureAdmin(admin.ModelAdmin):
    search_fields = ["name"]

    def get_list_display(self, request):
        exclude = ["project_measures"]
        return get_final_display_list(RBMMeasure, exclude)


@admin.register(ProjectRBMMeasure)
class ProjectRbmMeasureAdmin(admin.ModelAdmin):
    search_fields = ["project__title", "measure__name"]
    list_filter = ["measure"]

    def get_list_display(self, request):
        exclude = ["project"]
        return get_final_display_list(ProjectRBMMeasure, exclude)
