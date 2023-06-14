from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.project_sector import ProjectSector, ProjectSubSector


@admin.register(ProjectSector)
class ProjectSectorAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["projectsubsector"]
        return get_final_display_list(ProjectSector, exclude)


@admin.register(ProjectSubSector)
class ProjectSubSectorAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]
    list_filter = [
        "sector",
    ]

    def get_list_display(self, request):
        exclude = ["projectsubmission"]
        return get_final_display_list(ProjectSubSector, exclude)
