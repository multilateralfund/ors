from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin


from core.admin.utils import get_final_display_list
from core.models.project_completion_report import (
    OLD_DelayCategory,
    OLD_LearnedLessonCategory,
    OLD_PCRActivity,
    OLD_PCRDelayExplanation,
    OLD_PCRLearnedLessons,
    OLD_PCRSector,
)


@admin.register(OLD_PCRSector)
class OLD_PCRSectorAdmin(admin.ModelAdmin):
    admin_group = "PCR"
    search_fields = [
        "name",
    ]
    list_filter = [
        "sector_type",
    ]

    def get_list_display(self, request):
        exclude = ["old_pcractivity"]
        return get_final_display_list(OLD_PCRSector, exclude)


@admin.register(OLD_PCRActivity)
class OLD_PCRActivityAdmin(admin.ModelAdmin):
    admin_group = "PCR"
    search_fields = [
        "type_of_activity",
    ]
    list_filter = [
        AutocompleteFilterFactory("sector", "sector"),
        "evaluation",
    ]
    autocomplete_fields = ["sector"]

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(OLD_PCRActivity, exclude)


@admin.register(OLD_DelayCategory)
class OLD_DelayCategoryAdmin(admin.ModelAdmin):
    admin_group = "PCR"
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["old_pcrdelayexplanation"]
        return get_final_display_list(OLD_DelayCategory, exclude)


@admin.register(OLD_PCRDelayExplanation)
class OLD_PCRDelayExplanationAdmin(admin.ModelAdmin):
    search_fields = [
        "delay_cause",
    ]
    list_filter = [
        "category",
        "agency",
    ]

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(OLD_PCRDelayExplanation, exclude)


@admin.register(OLD_LearnedLessonCategory)
class OLD_LearnedLessonCategoryAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["old_pcrlearnedlessons"]
        return get_final_display_list(OLD_LearnedLessonCategory, exclude)


@admin.register(OLD_PCRLearnedLessons)
class OLD_PCRLearnedLessonsAdmin(admin.ModelAdmin):
    search_fields = [
        "description",
    ]
    list_filter = [
        "category",
        "agency",
    ]

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(OLD_PCRLearnedLessons, exclude)
