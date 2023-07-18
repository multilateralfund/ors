from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.project_submission import ProjectSubmission, SubmissionAmount


@admin.register(ProjectSubmission)
class ProjectSubmissionAdmin(admin.ModelAdmin):
    search_fields = [
        "project__title",
    ]
    list_filter = [
        "project__project_type",
        "project__agency",
        "category",
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related(
            "project__country", "project__subsector", "project__agency"
        )

    def get_list_display(self, request):
        exclude = ["submissionamount"]
        return get_final_display_list(ProjectSubmission, exclude)


@admin.register(SubmissionAmount)
class SubmissionAmountAdmin(admin.ModelAdmin):
    search_fields = [
        "submission__project__title",
    ]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("submission__project")

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(SubmissionAmount, exclude)
