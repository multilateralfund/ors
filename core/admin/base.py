from django.contrib import admin

from core.models.base import Module


@admin.register(Module)
class AgencyAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]
    list_display = [
        "code",
        "name",
        "description",
    ]
