from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.agency import Agency


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    admin_group = "Common"
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = [
            "annual_project_reports",
            "pcragency",
            "old_pcrdelayexplanation",
            "old_pcrlearnedlessons",
            "bpactivity",
            "bpfile",
            "coop_projects",
            "enterprises",
            "lead_projects",
            "metaproject",
            "pcrdelayexplanation",
            "pcrlearnedlessons",
            "old_pcractivity",
            "project",
            "user",
        ]
        fields = get_final_display_list(Agency, exclude)
        return fields
