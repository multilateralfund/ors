from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.time_frame import TimeFrame


@admin.register(TimeFrame)
class TimeFrameAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        exclude = [
            "admrow",
            "admcolumn",
            "excludedusage",
            "cpreportformatcolumn",
            "cpreportformatrow",
        ]
        return get_final_display_list(TimeFrame, exclude)
