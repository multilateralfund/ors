from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.group import Group


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
        "name_alt",
    ]

    def get_list_display(self, request):
        exclude = ["substances"]
        return get_final_display_list(Group, exclude)
