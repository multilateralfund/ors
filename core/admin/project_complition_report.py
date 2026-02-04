"""
Django Admin for Project Completion Report models.

Includes admin for both legacy models (for backward compatibility)
and new PCR models.
"""

from admin_auto_filters.filters import AutocompleteFilterFactory
from django.contrib import admin

from core.models.project_complition_report import (
    # Legacy models
    DelayCategory,
    LearnedLessonCategory,
    PCRActivityLegacy,
    PCRDelayExplanationLegacy,
    PCRLearnedLessonsLegacy,
    PCRSector,
    # Reference data models
    PCRProjectElement,
    PCRSDG,
    PCRGenderPhase,
    # Core PCR models
    ProjectCompletionReport,
    # Section models
    PCRProjectActivity,
    PCROverallAssessment,
    PCRComment,
    PCRCauseOfDelay,
    PCRCauseOfDelayCategory,
    PCRLessonLearned,
    PCRLessonLearnedCategory,
    PCRRecommendation,
    PCRGenderMainstreaming,
    PCRSDGContribution,
    PCRTrancheData,
    PCRAlternativeTechnology,
    PCREnterprise,
    PCRTraineeCount,
    PCREquipmentDisposal,
    PCRSupportingEvidence,
)


# Legacy model admins (kept for backward compatibility)


@admin.register(PCRSector)
class PCRSectorAdmin(admin.ModelAdmin):
    search_fields = ["name"]
    list_filter = ["sector_type"]
    list_display = ["name", "sector_type"]


@admin.register(PCRActivityLegacy)
class PCRActivityLegacyAdmin(admin.ModelAdmin):
    search_fields = ["type_of_activity"]
    list_filter = [
        AutocompleteFilterFactory("sector", "sector"),
        "evaluation",
    ]
    autocomplete_fields = ["sector", "meta_project"]
    list_display = ["meta_project", "sector", "type_of_activity", "evaluation"]


@admin.register(DelayCategory)
class DelayCategoryAdmin(admin.ModelAdmin):
    search_fields = ["name", "code"]
    list_display = ["name", "code", "sort_order"]
    list_editable = ["sort_order"]
    ordering = ["sort_order", "name"]


@admin.register(PCRDelayExplanationLegacy)
class PCRDelayExplanationLegacyAdmin(admin.ModelAdmin):
    search_fields = ["delay_cause"]
    list_filter = ["category", "agency"]
    autocomplete_fields = ["meta_project", "agency", "category"]
    list_display = ["meta_project", "agency", "category"]


@admin.register(LearnedLessonCategory)
class LearnedLessonCategoryAdmin(admin.ModelAdmin):
    search_fields = ["name", "code"]
    list_display = ["name", "code", "sort_order"]
    list_editable = ["sort_order"]
    ordering = ["sort_order", "name"]


@admin.register(PCRLearnedLessonsLegacy)
class PCRLearnedLessonsLegacyAdmin(admin.ModelAdmin):
    search_fields = ["description"]
    list_filter = ["category", "agency"]
    autocomplete_fields = ["meta_project", "agency", "category"]
    list_display = ["meta_project", "agency", "category"]


@admin.register(PCRProjectElement)
class PCRProjectElementAdmin(admin.ModelAdmin):
    search_fields = ["name", "code"]
    list_display = ["name", "code", "sort_order"]
    list_editable = ["sort_order"]
    ordering = ["sort_order"]


@admin.register(PCRSDG)
class PCRSDGAdmin(admin.ModelAdmin):
    search_fields = ["name", "code"]
    list_display = ["number", "name", "code"]
    ordering = ["number"]


@admin.register(PCRGenderPhase)
class PCRGenderPhaseAdmin(admin.ModelAdmin):
    search_fields = ["name", "code"]
    list_display = ["name", "code", "sort_order"]
    list_editable = ["sort_order"]
    ordering = ["sort_order"]


class PCRTrancheDataInline(admin.TabularInline):
    model = PCRTrancheData
    extra = 0
    fields = ["project", "agency", "funds_approved", "funds_disbursed"]
    readonly_fields = ["project_code"]
    autocomplete_fields = ["project", "agency"]
    can_delete = True


@admin.register(ProjectCompletionReport)
class ProjectCompletionReportAdmin(admin.ModelAdmin):
    search_fields = ["id"]
    list_filter = [
        "status",
        "financial_figures_status",
        "overall_rating",
        AutocompleteFilterFactory("meta_project", "meta_project"),
        AutocompleteFilterFactory("project", "project"),
    ]
    autocomplete_fields = ["meta_project", "project", "submitter", "created_by"]
    readonly_fields = [
        "date_created",
        "date_updated",
        "first_submission_date",
        "last_submission_date",
        "total_odp_approved",
        "total_odp_actual",
        "total_hfc_approved",
        "total_hfc_actual",
        "total_enterprises",
        "total_trainees",
        "total_funding_approved",
        "total_funding_disbursed",
        "total_funding_returned",
    ]
    list_display = [
        "id",
        "project_or_meta",
        "status",
        "financial_figures_status",
        "overall_rating",
        "submitter",
        "last_submission_date",
    ]
    inlines = [PCRTrancheDataInline]

    fieldsets = (
        ("Project Link", {"fields": ("meta_project", "project")}),
        (
            "Status & Submission",
            {
                "fields": (
                    "status",
                    "submitter",
                    "first_submission_date",
                    "last_submission_date",
                    "created_by",
                    "date_created",
                    "date_updated",
                )
            },
        ),
        (
            "Financial Overview",
            {
                "fields": (
                    "financial_figures_status",
                    "financial_figures_explanation",
                    (
                        "total_funding_approved",
                        "total_funding_disbursed",
                        "total_funding_returned",
                    ),
                )
            },
        ),
        (
            "Phase-Out Aggregates",
            {
                "fields": (
                    ("total_odp_approved", "total_odp_actual"),
                    ("total_hfc_approved", "total_hfc_actual"),
                    "total_enterprises",
                    "total_trainees",
                )
            },
        ),
        (
            "Project Assessment",
            {
                "fields": (
                    "all_goals_achieved",
                    "goals_not_achieved_explanation",
                    "overall_rating",
                    "overall_rating_other",
                    "overall_rating_explanation",
                    "completion_report_done_by",
                    "completion_report_done_by_other",
                )
            },
        ),
        ("Additional Information", {"fields": ("enterprise_addresses",)}),
    )


@admin.register(PCRProjectActivity)
class PCRProjectActivityAdmin(admin.ModelAdmin):
    search_fields = ["activity_type"]
    list_filter = [
        AutocompleteFilterFactory("pcr", "pcr"),
        "project_type",
        "sector",
    ]
    autocomplete_fields = ["pcr", "created_by"]
    list_display = ["pcr", "project_type", "sector", "date_created"]


@admin.register(PCROverallAssessment)
class PCROverallAssessmentAdmin(admin.ModelAdmin):
    list_filter = [
        "rating",
        AutocompleteFilterFactory("pcr", "pcr"),
    ]
    autocomplete_fields = ["pcr", "created_by"]
    list_display = ["pcr", "rating", "date_created"]


@admin.register(PCRComment)
class PCRCommentAdmin(admin.ModelAdmin):
    search_fields = ["comment_text"]
    list_filter = [
        "section",
        "entity_type",
        AutocompleteFilterFactory("pcr", "pcr"),
    ]
    autocomplete_fields = ["pcr", "created_by"]
    list_display = ["pcr", "section", "entity_type", "date_created"]


@admin.register(PCRCauseOfDelay)
class PCRCauseOfDelayAdmin(admin.ModelAdmin):
    search_fields = ["description"]
    list_filter = [
        AutocompleteFilterFactory("pcr", "pcr"),
        AutocompleteFilterFactory("project_element", "project_element"),
    ]
    autocomplete_fields = ["pcr", "project_element", "created_by"]
    list_display = ["pcr", "project_element", "date_created"]


@admin.register(PCRCauseOfDelayCategory)
class PCRCauseOfDelayCategoryAdmin(admin.ModelAdmin):
    list_filter = [
        AutocompleteFilterFactory("cause_of_delay", "cause_of_delay"),
        AutocompleteFilterFactory("category", "category"),
    ]
    autocomplete_fields = ["cause_of_delay", "category"]
    list_display = ["cause_of_delay", "category"]


@admin.register(PCRLessonLearned)
class PCRLessonLearnedAdmin(admin.ModelAdmin):
    search_fields = ["description"]
    list_filter = [
        AutocompleteFilterFactory("pcr", "pcr"),
        AutocompleteFilterFactory("project_element", "project_element"),
    ]
    autocomplete_fields = ["pcr", "project_element", "created_by"]
    list_display = ["pcr", "project_element", "date_created"]


@admin.register(PCRLessonLearnedCategory)
class PCRLessonLearnedCategoryAdmin(admin.ModelAdmin):
    list_filter = [
        AutocompleteFilterFactory("lesson_learned", "lesson_learned"),
        AutocompleteFilterFactory("category", "category"),
    ]
    autocomplete_fields = ["lesson_learned", "category"]
    list_display = ["lesson_learned", "category"]


@admin.register(PCRRecommendation)
class PCRRecommendationAdmin(admin.ModelAdmin):
    search_fields = ["recommendation_text"]
    list_filter = [
        AutocompleteFilterFactory("pcr", "pcr"),
    ]
    autocomplete_fields = ["pcr", "created_by"]
    list_display = ["pcr", "date_created"]


@admin.register(PCRGenderMainstreaming)
class PCRGenderMainstreamingAdmin(admin.ModelAdmin):
    list_filter = [
        "indicator_met",
        AutocompleteFilterFactory("pcr", "pcr"),
        AutocompleteFilterFactory("phase", "phase"),
    ]
    autocomplete_fields = ["pcr", "phase", "created_by"]
    list_display = ["pcr", "phase", "indicator_met", "date_created"]


@admin.register(PCRSDGContribution)
class PCRSDGContributionAdmin(admin.ModelAdmin):
    search_fields = ["description"]
    list_filter = [
        AutocompleteFilterFactory("pcr", "pcr"),
        AutocompleteFilterFactory("sdg", "sdg"),
    ]
    autocomplete_fields = ["pcr", "sdg", "created_by"]
    list_display = ["pcr", "sdg", "date_created"]


@admin.register(PCRTrancheData)
class PCRTrancheDataAdmin(admin.ModelAdmin):
    search_fields = ["project_code"]
    list_filter = [
        AutocompleteFilterFactory("pcr", "pcr"),
        AutocompleteFilterFactory("project", "project"),
        AutocompleteFilterFactory("agency", "agency"),
    ]
    autocomplete_fields = ["pcr", "project", "agency", "created_by"]
    readonly_fields = [
        "planned_duration_months",
        "actual_duration_months",
        "delay_months",
        "date_created",
        "date_updated",
    ]
    list_display = [
        "pcr",
        "project_code",
        "agency",
        "funds_approved",
        "funds_disbursed",
        "delay_months",
    ]


@admin.register(PCRAlternativeTechnology)
class PCRAlternativeTechnologyAdmin(admin.ModelAdmin):
    list_filter = [
        AutocompleteFilterFactory("tranche", "tranche"),
    ]
    autocomplete_fields = ["tranche", "substance_from", "substance_to", "created_by"]
    list_display = ["tranche", "substance_from", "substance_to"]


@admin.register(PCREnterprise)
class PCREnterpriseAdmin(admin.ModelAdmin):
    search_fields = ["address"]
    list_filter = [
        AutocompleteFilterFactory("tranche", "tranche"),
    ]
    autocomplete_fields = ["tranche", "created_by"]
    list_display = ["tranche", "address"]


@admin.register(PCRTraineeCount)
class PCRTraineeCountAdmin(admin.ModelAdmin):
    list_filter = [
        "gender",
        AutocompleteFilterFactory("tranche", "tranche"),
    ]
    autocomplete_fields = ["tranche", "created_by"]
    list_display = ["tranche", "gender", "count"]


@admin.register(PCREquipmentDisposal)
class PCREquipmentDisposalAdmin(admin.ModelAdmin):
    search_fields = ["equipment_name", "description"]
    list_filter = [
        "disposal_type",
        AutocompleteFilterFactory("tranche", "tranche"),
    ]
    autocomplete_fields = ["tranche", "created_by"]
    list_display = ["tranche", "equipment_name", "disposal_type", "disposal_date"]


@admin.register(PCRSupportingEvidence)
class PCRSupportingEvidenceAdmin(admin.ModelAdmin):
    search_fields = ["description"]
    list_filter = [
        "related_section",
        AutocompleteFilterFactory("pcr", "pcr"),
    ]
    autocomplete_fields = ["pcr", "uploaded_by"]
    list_display = ["pcr", "related_section", "file", "url", "date_created"]
