from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin


from core.admin.utils import get_final_display_list
from core.models.project_completion_report import (
    PCRDelayCategory,
    PCRDelayCause,
    PCRGenderMainstreaming,
    PCRGoal,
    PCRLearnedLesson,
    PCRLearnedLessonCategory,
    PCR,
    PCRAgency,
    PCRActivity,
    PCRProject,
    PCRAdditionalComment,
    PCRProjectComponentOption,
    PCRProjectComponent,
    PCRSustainableDevelopmentGoalDescription,
    PCRSustainableDevelopmentGoal,
    PCRSupportingEvidenceSection,
    PCRSupportingEvidence,
    OLD_DelayCategory,
    OLD_LearnedLessonCategory,
    OLD_PCRActivity,
    OLD_PCRDelayExplanation,
    OLD_PCRLearnedLessons,
    OLD_PCRSector,
)


@admin.register(PCR)
class PCRAdmin(admin.ModelAdmin):
    admin_group = "PCR"
    search_fields = [
        "meta_project__umbrella_code",
    ]
    list_display = [
        "meta_project",
    ]
    list_filter = [
        AutocompleteFilterFactory("meta_project", "meta_project"),
    ]
    raw_id_fields = [
        "meta_project",
    ]


@admin.register(PCRProject)
class PCRProjectAdmin(admin.ModelAdmin):
    admin_group = "PCR"
    search_fields = [
        "pcr__meta_project__umbrella_code",
    ]
    list_display = [
        "pcr",
        "project",
    ]
    list_filter = [
        AutocompleteFilterFactory("pcr", "pcr"),
        AutocompleteFilterFactory("project", "project"),
    ]
    raw_id_fields = [
        "pcr",
        "project",
    ]


@admin.register(PCRAdditionalComment)
class PCRAdditionalCommentAdmin(admin.ModelAdmin):
    admin_group = "PCR"
    search_fields = [
        "pcr_project__pcr__meta_project__umbrella_code",
    ]
    list_display = [
        "pcr_project",
    ]
    list_filter = [
        AutocompleteFilterFactory("pcr_project", "pcr_project"),
    ]
    raw_id_fields = [
        "pcr_project",
    ]


@admin.register(PCRActivity)
class PCRActivityAdmin(admin.ModelAdmin):
    admin_group = "PCR"
    search_fields = [
        "pcr__meta_project__umbrella_code",
    ]
    list_display = [
        "pcr",
    ]
    list_filter = [
        AutocompleteFilterFactory("pcr", "pcr"),
    ]
    raw_id_fields = [
        "pcr",
    ]


@admin.register(PCRProjectComponentOption)
class PCRProjectComponentOptionAdmin(admin.ModelAdmin):
    admin_group = "PCR"

    def get_list_display(self, request):
        exclude = ["pcrprojectcomponent"]
        return get_final_display_list(PCRProjectComponentOption, exclude)


@admin.register(PCRDelayCategory)
class PCRDelayCategoryAdmin(admin.ModelAdmin):
    admin_group = "PCR"

    def get_list_display(self, request):
        exclude = [
            "pcrdelaycause",
        ]
        return get_final_display_list(PCRDelayCategory, exclude)

    def get_queryset(self, request):
        return PCRDelayCategory.objects.really_all()


@admin.register(PCRAgency)
class PCRAgencyAdmin(admin.ModelAdmin):
    admin_group = "PCR"
    search_fields = [
        "pcr__meta_project__umbrella_code",
        "agency",
    ]
    list_filter = [
        AutocompleteFilterFactory("pcr", "pcr"),
        AutocompleteFilterFactory("agency", "agency"),
    ]
    raw_id_fields = [
        "pcr",
    ]
    autocomplete_fields = [
        "agency",
    ]

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(PCRAgency, exclude)


@admin.register(PCRProjectComponent)
class PCRProjectComponentAdmin(admin.ModelAdmin):
    admin_group = "PCR"
    search_fields = [
        "pcr_agency__pcr__meta_project__umbrella_code",
        "project_component_option__name",
    ]
    list_filter = [
        AutocompleteFilterFactory("pcr_agency", "pcr_agency"),
        AutocompleteFilterFactory(
            "project_component_option", "project_component_option"
        ),
    ]
    raw_id_fields = [
        "pcr_agency",
    ]

    def get_list_display(self, request):
        exclude = [
            "delaycause",
            "lessonslearned",
        ]
        return get_final_display_list(PCRProjectComponent, exclude)


@admin.register(PCRDelayCause)
class PCRDelayCauseAdmin(admin.ModelAdmin):
    admin_group = "PCR"
    search_fields = [
        "pcr_project_component__pcr_agency__pcr__meta_project__umbrella_code",
        "delay",
    ]
    list_filter = [
        AutocompleteFilterFactory("pcr_project_component", "pcr_project_component"),
        AutocompleteFilterFactory("delay", "delay"),
    ]
    raw_id_fields = [
        "pcr_project_component",
    ]

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(PCRDelayCause, exclude)


@admin.register(PCRLearnedLessonCategory)
class PCRLearnedLessonCategoryAdmin(admin.ModelAdmin):
    admin_group = "PCR"

    def get_list_display(self, request):
        exclude = [
            "pcrlearnedlesson",
        ]
        return get_final_display_list(PCRLearnedLessonCategory, exclude)

    def get_queryset(self, request):
        return PCRLearnedLessonCategory.objects.really_all()


@admin.register(PCRLearnedLesson)
class PCRLearnedLessonAdmin(admin.ModelAdmin):
    admin_group = "PCR"
    search_fields = [
        "pcr_project_component__pcr_agency__pcr__meta_project__umbrella_code",
        "lesson",
    ]
    list_filter = [
        AutocompleteFilterFactory("pcr_project_component", "pcr_project_component"),
        AutocompleteFilterFactory("lesson", "lesson"),
    ]
    raw_id_fields = [
        "pcr_project_component",
    ]

    def get_list_display(self, request):
        exclude = []
        return get_final_display_list(PCRLearnedLesson, exclude)


@admin.register(PCRGenderMainstreaming)
class PCRGenderMainstreamingAdmin(admin.ModelAdmin):
    admin_group = "PCR"

    search_fields = [
        "pcr_agency__pcr__meta_project__umbrella_code",
    ]
    list_filter = [
        AutocompleteFilterFactory("pcr_agency", "pcr_agency"),
        "project_preparation",
    ]
    raw_id_fields = [
        "pcr_agency",
    ]


@admin.register(PCRGoal)
class PCRGoalAdmin(admin.ModelAdmin):
    admin_group = "PCR"

    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = [
            "pcrsustainabledevelopmentgoaldescription",
            "sustainable_development_goals",
        ]
        return get_final_display_list(PCRGoal, exclude)


class PCRSustainableDevelopmentGoalDescriptionInline(admin.TabularInline):
    model = PCRSustainableDevelopmentGoalDescription
    fk_name = "sgr"
    extra = 1
    autocomplete_fields = ["goal"]
    verbose_name = "Goal assignment"
    verbose_name_plural = "Goals"


@admin.register(PCRSustainableDevelopmentGoal)
class PCRSustainableDevelopmentGoalAdmin(admin.ModelAdmin):
    admin_group = "PCR"
    inlines = [PCRSustainableDevelopmentGoalDescriptionInline]
    search_fields = [
        "pcr_agency__pcr__meta_project__umbrella_code",
    ]
    list_filter = [
        AutocompleteFilterFactory("pcr_agency", "pcr_agency"),
        "goals",
    ]
    raw_id_fields = ["pcr_agency"]


@admin.register(PCRSupportingEvidenceSection)
class PCRSupportingEvidenceSectionAdmin(admin.ModelAdmin):
    admin_group = "PCR"
    search_fields = [
        "code",
        "name",
    ]
    list_display = [
        "code",
        "name",
        "sort_order",
    ]


@admin.register(PCRSupportingEvidence)
class PCRSupportingEvidenceAdmin(admin.ModelAdmin):
    admin_group = "PCR"
    search_fields = [
        "pcr_agency__pcr__meta_project__umbrella_code",
    ]
    list_filter = [
        AutocompleteFilterFactory("pcr_agency", "pcr_agency"),
        AutocompleteFilterFactory("section", "section"),
    ]
    raw_id_fields = [
        "pcr_agency",
    ]
    autocomplete_fields = [
        "section",
    ]


@admin.register(OLD_PCRSector)
class OLD_PCRSectorAdmin(admin.ModelAdmin):
    admin_group = "PCR (OBSOLETE)"
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
    admin_group = "PCR (OBSOLETE)"
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
    admin_group = "PCR (OBSOLETE)"
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["old_pcrdelayexplanation"]
        return get_final_display_list(OLD_DelayCategory, exclude)


@admin.register(OLD_PCRDelayExplanation)
class OLD_PCRDelayExplanationAdmin(admin.ModelAdmin):
    admin_group = "PCR (OBSOLETE)"
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
    admin_group = "PCR (OBSOLETE)"
    search_fields = [
        "name",
    ]

    def get_list_display(self, request):
        exclude = ["old_pcrlearnedlessons"]
        return get_final_display_list(OLD_LearnedLessonCategory, exclude)


@admin.register(OLD_PCRLearnedLessons)
class OLD_PCRLearnedLessonsAdmin(admin.ModelAdmin):
    admin_group = "PCR (OBSOLETE)"
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
