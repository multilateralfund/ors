from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models import AnnualProjectReport


@admin.register(AnnualProjectReport)
class AnnualProjectReportAdmin(admin.ModelAdmin):
    list_filter = [AutocompleteFilterFactory("Project", "project")]
    search_fields = ["project__title"]
    list_per_page = 20

    def get_list_display(self, request):
        exclude = ["last_year_remarks", "current_year_remarks"]
        return get_final_display_list(AnnualProjectReport, exclude)
