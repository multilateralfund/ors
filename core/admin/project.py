from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin
from django.contrib.admin import SimpleListFilter
from django.utils.html import format_html_join

from core.admin.utils import get_final_display_list
from core.models.meeting import Decision, Meeting
from core.models.project_history import ProjectHistory
from core.models.project import (
    MetaProject,
    Project,
    ProjectComment,
    ProjectComponents,
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
        exclude = [
            "project",
            "pcractivity",
            "pcrlearnedlessons",
            "pcrdelayexplanation",
            "projects",
        ]
        return get_final_display_list(MetaProject, exclude)


@admin.register(ProjectComponents)
class ProjectComponentsAdmin(admin.ModelAdmin):
    pass


class ProjectFileInline(admin.TabularInline):
    model = ProjectFile
    extra = 1


class LatestProjectVersionsFilter(SimpleListFilter):
    title = "Only latest project versions/Only archived projects"
    parameter_name = "latest_project_versions"

    def lookups(self, request, model_admin):
        return (
            ("latest_projects", "Only latest project versions"),
            ("archived_projects", "Only archived projects"),
        )

    def queryset(self, request, queryset):
        if self.value() == "latest_projects":
            return queryset.filter(latest_project__isnull=True)
        if self.value() == "archived_projects":
            return queryset.filter(latest_project__isnull=False)
        return queryset


@admin.register(ProjectHistory)
class ProjectHistoryAdmin(admin.ModelAdmin):
    search_fields = [
        "project__title",
    ]
    readonly_fields = ("created_at",)
    list_filter = [
        AutocompleteFilterFactory("project", "project"),
    ]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    inlines = [ProjectFileInline]
    search_fields = [
        "title",
        "code",
    ]
    list_filter = [
        LatestProjectVersionsFilter,
        AutocompleteFilterFactory("agency", "agency"),
        AutocompleteFilterFactory("sector", "sector"),
        AutocompleteFilterFactory("subsectors", "subsectors"),
        AutocompleteFilterFactory("project_type", "project_type"),
        AutocompleteFilterFactory("cluster", "cluster"),
        AutocompleteFilterFactory("country", "country"),
        AutocompleteFilterFactory("latest_project", "latest_project"),
        "substance_type",
        "meta_project__type",
        "status",
        "submission_status",
    ]
    autocomplete_fields = [
        "country",
        "sector",
        "subsectors",
        "agency",
        "project_type",
        "latest_project",
    ]
    raw_id_fields = [
        "bp_activity",
    ]

    def get_list_display(self, request):
        exclude = [
            "component",
            "progress_reports",
            "projectsubmission",
            "ods_odp",
            "enterprises",
            "funds",
            "submission",
            "files",
            "comments",
            "submission_amounts",
            "rbm_measures",
            "latest_project",
            "archive_projects",
            "project_history",
        ]
        return get_final_display_list(Project, exclude)

    def get_queryset(self, request):
        return Project.objects.really_all()

    def other_projects_in_component(self, obj):
        if not obj.component_id:
            return "-"
        # Exclude the current project from the list
        other_projects = (
            Project.objects.really_all()
            .filter(component_id=obj.component_id)
            .exclude(id=obj.id)
        )
        if not other_projects.exists():
            return "-"
        return format_html_join(
            "",
            '<p><a href="{}">{}</a></p>',
            (
                (
                    f"/admin/core/project/{p.id}/change/",
                    f"{p.title or str(p)} version {p.version}",
                )
                for p in other_projects
            ),
        )

    other_projects_in_component.short_description = "Other Projects in Same Component"

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        # Add the custom field at the end if not already present
        if "other_projects_in_component" not in fields:
            fields = list(fields) + ["other_projects_in_component"]
        return fields

    readonly_fields = ["other_projects_in_component"]


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

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "project":
            # Use Project.objects.really_all() to include all projects
            kwargs["queryset"] = Project.objects.really_all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(ProjectFile)
class ProjectFileAdmin(admin.ModelAdmin):
    list_filter = []

    list_filter = [
        AutocompleteFilterFactory("project", "project"),
    ]

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(ProjectFile, exclude)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "project":
            # Use Project.objects.really_all() to include all projects
            kwargs["queryset"] = Project.objects.really_all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


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

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "project":
            # Use Project.objects.really_all() to include all projects
            kwargs["queryset"] = Project.objects.really_all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(ProjectOdsOdp)
class ProjectOdsOdpAdmin(admin.ModelAdmin):
    search_fields = [
        "project__title",
    ]
    list_filter = [
        "ods_type",
        AutocompleteFilterFactory("ods_substance", "ods_substance"),
        AutocompleteFilterFactory("project", "project"),
    ]

    def get_list_display(self, request):
        exclude = ["project"]
        return get_final_display_list(ProjectOdsOdp, exclude)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "project":
            # Use Project.objects.really_all() to include all projects
            kwargs["queryset"] = Project.objects.really_all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


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

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "project":
            # Use Project.objects.really_all() to include all projects
            kwargs["queryset"] = Project.objects.really_all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(SubmissionAmount)
class SubmissionAmountAdmin(admin.ModelAdmin):
    search_fields = [
        "project__title",
    ]

    list_filter = [
        AutocompleteFilterFactory("project", "project"),
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("project")

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(SubmissionAmount, exclude)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "project":
            # Use Project.objects.really_all() to include all projects
            kwargs["queryset"] = Project.objects.really_all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


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
            "bp_projects",
            "bilateralassistance",
        ]
        return get_final_display_list(Meeting, exclude)


@admin.register(Decision)
class DecisionAdmin(admin.ModelAdmin):
    search_fields = ["number"]

    def get_list_display(self, request):
        exclude = [
            "project",
            "businessplan",
            "bp_projects",
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

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "project":
            # Use Project.objects.really_all() to include all projects
            kwargs["queryset"] = Project.objects.really_all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
