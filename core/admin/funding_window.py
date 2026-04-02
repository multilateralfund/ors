from django.contrib import admin

from core.models import FundingWindow


@admin.register(FundingWindow)
class FundingWindowAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return [
            "id",
            "meeting",
            "decision",
            "description",
            "amount",
            "remarks",
        ]
