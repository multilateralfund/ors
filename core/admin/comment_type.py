from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.base import CommentType


@admin.register(CommentType)
class CommentTypeAdmin(admin.ModelAdmin):
    search_fields = ["name"]

    def get_list_display(self, request):
        exclude = ["bprecord"]
        return get_final_display_list(CommentType, exclude)
