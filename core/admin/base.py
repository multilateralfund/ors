from django.contrib import admin

from core.models.base import Module


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]
    list_display = [
        "code",
        "name",
        "description",
    ]
