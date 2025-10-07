from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.agency import Agency


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = [
            "annual_project_reports",
            "bpactivity",
            "bpfile",
            "coop_projects",
            "enterprises",
            "lead_projects",
            "metaproject",
            "pcrdelayexplanation",
            "pcrlearnedlessons",
            "project",
            "user",
        ]
        fields = get_final_display_list(Agency, exclude)
        return fields
