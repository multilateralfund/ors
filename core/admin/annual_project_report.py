from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models import (
    AnnualProjectReport,
    AnnualProgressReport,
    AnnualAgencyProjectReport,
    AnnualProjectReportFile,
)


@admin.register(AnnualProgressReport)
class AnnualProgressReportAdmin(admin.ModelAdmin):
    list_filter = ["year", "endorsed"]

    def get_list_display(self, request):
        return get_final_display_list(AnnualProgressReport, [])


class AnnualProjectReportFileInline(admin.TabularInline):
    model = AnnualProjectReportFile
    extra = 1


@admin.register(AnnualAgencyProjectReport)
class AnnualAgencyProjectReportAdmin(admin.ModelAdmin):
    inlines = [AnnualProjectReportFileInline]
    list_filter = [
        AutocompleteFilterFactory("Agency", "agency"),
        AutocompleteFilterFactory("Progress Report", "progress_report"),
    ]
    list_per_page = 20

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("agency", "progress_report")

    def get_list_display(self, request):
        return get_final_display_list(AnnualAgencyProjectReport, [])


@admin.register(AnnualProjectReportFile)
class AnnualProjectReportFileAdmin(admin.ModelAdmin):
    list_filter = [AutocompleteFilterFactory("Report", "report")]

    def get_list_display(self, request):
        return get_final_display_list(AnnualProjectReportFile, [])


@admin.register(AnnualProjectReport)
class AnnualProjectReportAdmin(admin.ModelAdmin):
    list_filter = [AutocompleteFilterFactory("Project", "project")]
    search_fields = ["project__title"]
    list_per_page = 20

    def get_list_display(self, request):
        exclude = ["last_year_remarks", "current_year_remarks"]
        return get_final_display_list(AnnualProjectReport, exclude)
