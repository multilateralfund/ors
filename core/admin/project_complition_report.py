from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.admin.utils import get_final_display_list
from core.models.project_complition_report import (
    DelayCategory,
    LearnedLessonCategory,
    PCRActivity,
    PCRDelayExplanation,
    PCRLearnedLessons,
    PCRSector,
)


@admin.register(PCRSector)
class PCRSectorAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]
    list_filter = [
        "sector_type",
    ]

    def get_list_display(self, request):
        exclude = ["pcractivity"]
        return get_final_display_list(PCRSector, exclude)


@admin.register(PCRActivity)
class PCRActivityAdmin(admin.ModelAdmin):
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
        return get_final_display_list(PCRActivity, exclude)


@admin.register(DelayCategory)
class DelayCategoryAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["pcrdelayexplanation"]
        return get_final_display_list(DelayCategory, exclude)


@admin.register(PCRDelayExplanation)
class PCRDelayExplanationAdmin(admin.ModelAdmin):
    search_fields = [
        "delay_cause",
    ]
    list_filter = [
        "category",
        "agency",
    ]

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(PCRDelayExplanation, exclude)


@admin.register(LearnedLessonCategory)
class LearnedLessonCategoryAdmin(admin.ModelAdmin):
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["pcrlearnedlessons"]
        return get_final_display_list(LearnedLessonCategory, exclude)


@admin.register(PCRLearnedLessons)
class PCRLearnedLessonsAdmin(admin.ModelAdmin):
    search_fields = [
        "description",
    ]
    list_filter = [
        "category",
        "agency",
    ]

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(PCRLearnedLessons, exclude)
