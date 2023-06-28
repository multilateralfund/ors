from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.project_submission import ProjectSubmission


@admin.register(ProjectSubmission)
class ProjectSubmissionAdmin(admin.ModelAdmin):
    search_fields = [
        "title",
    ]
    list_filter = [
        "type",
        "agency",
        "category",
    ]
    autocomplete_fields = ["country", "subsector"]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("country", "subsector", "agency")

    def get_list_display(self, request):
        exclude = ["submissionodsodp", "submissionamount"]
        return get_final_display_list(ProjectSubmission, exclude)
