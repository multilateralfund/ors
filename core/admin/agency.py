from django.contrib import admin
from core.admin.utils import get_final_display_list
from core.models.agency import Agency


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["projectsubmission"]
        return get_final_display_list(Agency, exclude)
