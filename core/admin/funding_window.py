from admin_auto_filters.filters import AutocompleteFilterFactory

from django.contrib import admin

from core.models import FundingWindow


@admin.register(FundingWindow)
class FundingWindowAdmin(admin.ModelAdmin):
    admin_group = "Projects"
    list_filter = [
        AutocompleteFilterFactory("meeting", "meeting"),
        AutocompleteFilterFactory("decision", "decision"),
    ]
    autocomplete_fields = [
        "meeting",
        "decision",
    ]

    def get_list_display(self, request):
        return [
            "id",
            "meeting",
            "decision",
            "description",
            "amount",
            "remarks",
        ]
