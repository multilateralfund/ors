from datetime import date

from django.conf import settings
from django.db import models
from django.db.models import Sum

from core.models.agency import Agency
from core.models.project import MetaProject, Project
from core.models.substance import Substance
from core.models.utils import get_protected_storage

# pylint: disable=C0302,R0902

# Legacy models


class PCRSector(models.Model):
    """
    Legacy model for PCR sectors.
    Kept for backward compatibility with imported JSON data.
    """

    class PCRSectorType(models.TextChoices):
        INVESTMENT = "1", "Investment"
        NONINVESTMENT = "2", "Non-investment"

    name = models.CharField(max_length=255, blank=True, null=True)
    sector_type = models.CharField(
        max_length=255, choices=PCRSectorType.choices, blank=True, null=True
    )

    def __str__(self):
        return self.name or ""


class PCRActivityLegacy(models.Model):
    """
    Legacy model for PCR activities.
    Renamed from PCRActivity to avoid conflicts.
    Kept for backward compatibility with imported JSON data.
    """

    meta_project = models.ForeignKey(MetaProject, on_delete=models.CASCADE)
    sector = models.ForeignKey(PCRSector, on_delete=models.CASCADE)
    type_of_activity = models.TextField(blank=True, null=True)
    planned_output = models.TextField(blank=True, null=True)
    actual_activity_output = models.TextField(blank=True, null=True)
    evaluation = models.IntegerField(blank=True, null=True)
    explanation = models.TextField(blank=True, null=True)
    source_file = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "PCR Activity (Legacy)"
        verbose_name_plural = "PCR Activities (Legacy)"
        db_table = "core_pcractivity"  # Keep original table name


class PCRDelayExplanationLegacy(models.Model):
    """
    Legacy model for PCR delay explanations.
    Renamed to avoid conflicts.
    Kept for backward compatibility with imported JSON data.
    """

    meta_project = models.ForeignKey(MetaProject, on_delete=models.CASCADE)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    category = models.ForeignKey("DelayCategory", on_delete=models.CASCADE)
    delay_cause = models.TextField(blank=True, null=True)
    measures_to_overcome = models.TextField(blank=True, null=True)
    source_file = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "PCR Delay Explanation (Legacy)"
        verbose_name_plural = "PCR Delay Explanations (Legacy)"
        db_table = "core_pcrdelayexplanation"  # Keep original table name


class PCRLearnedLessonsLegacy(models.Model):
    """
    Legacy model for PCR learned lessons.
    Renamed to avoid conflicts.
    Kept for backward compatibility with imported JSON data.
    """

    meta_project = models.ForeignKey(MetaProject, on_delete=models.CASCADE)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    category = models.ForeignKey("LearnedLessonCategory", on_delete=models.CASCADE)
    description = models.TextField(blank=True, null=True)
    source_file = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "PCR Learned Lesson (Legacy)"
        verbose_name_plural = "PCR Learned Lessons (Legacy)"
        db_table = "core_pcrlearnedlessons"  # Keep original table name


# Reference data models


class DelayCategory(models.Model):
    # TODO: I think we actually don't need `code`
    code = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        help_text="Unique code",
    )
    name = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(
        blank=True, null=True, help_text="Detailed description of the delay cause"
    )
    sort_order = models.FloatField(default=0, help_text="Display order in forms")

    class Meta:
        verbose_name_plural = "Delay Categories"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class LearnedLessonCategory(models.Model):
    # I think we don't need code
    code = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        help_text="Unique code for programmatic access",
    )
    name = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(
        blank=True, null=True, help_text="Detailed description of the lesson category"
    )
    sort_order = models.FloatField(default=0, help_text="Display order in forms")

    class Meta:
        verbose_name_plural = "Learned Lesson Categories"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class PCRProjectElement(models.Model):
    # TODO: code?
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        verbose_name = "PCR Project Element"
        verbose_name_plural = "PCR Project Elements"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class PCRSDG(models.Model):
    # TODO: code?
    code = models.CharField(
        max_length=20, unique=True, help_text="e.g., 'goal_1', 'goal_2'"
    )
    number = models.IntegerField(unique=True, help_text="SDG number (1-17)")
    name = models.CharField(
        max_length=255, help_text="e.g., 'No poverty', 'Zero hunger'"
    )
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "SDG"
        verbose_name_plural = "SDGs"
        ordering = ["number"]

    def __str__(self):
        return f"Goal {self.number}: {self.name}"


class PCRGenderPhase(models.Model):
    """
    Reference model for gender mainstreaming phases.
    Examples: preparation, formulation, implementation, monitoring
    """

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        verbose_name = "PCR Gender Phase"
        verbose_name_plural = "PCR Gender Phases"
        ordering = ["sort_order"]

    def __str__(self):
        return self.name


# Overview models


class ProjectCompletionReport(models.Model):
    """
    Main Project Completion Report container.
    One PCR per project or metacode.

    Follows APR pattern but simpler workflow (no endorsement).
    Contains overview data (Section 1) and aggregated summaries.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"

    class FinancialFiguresStatus(models.TextChoices):
        PROVISIONAL = "provisional", "Provisional"
        FINAL = "final", "Final"

    class OverallRating(models.TextChoices):
        HIGHLY_SATISFACTORY = "highly_satisfactory", "Highly satisfactory"
        SATISFACTORY_PLANNED = "satisfactory_planned", "Satisfactory as planned"
        SATISFACTORY_NOT_PLANNED = (
            "satisfactory_not_planned",
            "Satisfactory but not as planned",
        )
        UNSATISFACTORY = "unsatisfactory", "Unsatisfactory"
        OTHER = "other", "Other, please specify"

    class CompletionReportDoneBy(models.TextChoices):
        LEAD_AGENCY = "lead_agency", "Lead Agency"
        COOPERATING_AGENCY = "cooperating_agency", "Cooperating Agency"
        NOU = "nou", "National coordinating agency/NOU"
        LOCAL_AGENCY = "local_agency", "Local executing agency"
        OTHER = "other", "Other"

    # Foreign Keys - Either meta_project OR project must be set
    meta_project = models.ForeignKey(
        MetaProject,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="completion_reports",
        help_text="For MYA projects - PCR initiated at metacode level",
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="completion_reports",
        help_text="For IND projects - PCR initiated at project level",
    )

    # Status and workflow
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )

    # Section 1.6: User Input Fields
    submitter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="submitted_pcrs",
        help_text="User who submitted the PCR",
        null=True,
        blank=True,
    )
    first_submission_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date of first submission - never changes after first submit",
    )
    last_submission_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date of most recent submission - updated on each submit",
    )

    financial_figures_status = models.CharField(
        max_length=20,
        choices=FinancialFiguresStatus.choices,
        help_text="Indicate whether the financial figures are Provisional or Final",
    )
    financial_figures_explanation = models.TextField(
        blank=True,
        null=True,
        help_text="Explanations if needed (150-250 words suggested)",
    )

    enterprise_addresses = models.TextField(
        blank=True,
        null=True,
        help_text="Address(es) of enterprise(s) and project site(s) (150-250 words suggested)",
    )

    all_goals_achieved = models.BooleanField(
        null=True, blank=True, help_text="All project goals achieved?"
    )
    goals_not_achieved_explanation = models.TextField(
        blank=True,
        null=True,
        help_text="Required if all goals not achieved (150-250 words suggested)",
    )

    overall_rating = models.CharField(
        max_length=50,
        choices=OverallRating.choices,
        help_text="Choose the rating from the list",
    )
    overall_rating_other = models.TextField(
        blank=True, null=True, help_text="Specify if rating is 'Other'"
    )
    overall_rating_explanation = models.TextField(
        help_text="Please explain your rating (150-250 words suggested)"
    )

    completion_report_done_by = models.CharField(
        max_length=50,
        choices=CompletionReportDoneBy.choices,
        help_text="Completion report done by",
    )
    completion_report_done_by_other = models.CharField(
        max_length=255, blank=True, null=True, help_text="Specify if 'Other'"
    )

    # Cached aggregations from tranches (Section 1.2, 1.3, 1.4, 1.5)
    # Updated automatically when tranches are saved
    total_odp_approved = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Aggregated from tranches - ODP phase-out (Approved)",
    )
    total_odp_actual = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Aggregated from tranches - ODP phase-out (Actual)",
    )
    total_hfc_approved = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Aggregated from tranches - HFCs phased-down CO2-eq tonnes (Approved)",
    )
    total_hfc_actual = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Aggregated from tranches - HFCs phased-down CO2-eq tonnes (Actual)",
    )
    total_enterprises = models.IntegerField(
        null=True,
        blank=True,
        help_text="Aggregated from tranches - Number of enterprises",
    )
    total_trainees = models.IntegerField(
        null=True,
        blank=True,
        help_text="Aggregated from tranches - Total number of trainees",
    )
    total_funding_approved = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Aggregated from tranches - Total MLF funding approved (US$)",
    )
    total_funding_disbursed = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Aggregated from tranches - Total MLF funding disbursed (US$)",
    )
    total_funding_returned = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Calculated: Approved - Disbursed",
    )

    # Audit fields
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_pcrs",
        help_text="User who created the PCR",
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Project Completion Report"
        verbose_name_plural = "Project Completion Reports"
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(meta_project__isnull=False, project__isnull=True)
                    | models.Q(meta_project__isnull=True, project__isnull=False)
                ),
                name="pcr_either_meta_project_or_project",
            )
        ]

    def __str__(self):
        if self.meta_project:
            # TODO: is umbrella_code the right thing to return here?
            return f"PCR: {self.meta_project.umbrella_code}"
        if self.project:
            return f"PCR: {self.project.code}"
        return f"PCR #{self.id}"

    @property
    def project_or_meta(self):
        """Returns the associated project or meta_project"""
        return self.meta_project or self.project

    @property
    def lead_agency(self):
        if self.meta_project:
            return self.meta_project.lead_agency
        if self.project:
            return self.project.lead_agency
        return None

    @property
    def agency(self):
        if self.meta_project:
            # meta_project seems to only have lead_agency
            return None
        if self.project:
            return self.project.agency
        return None

    @property
    def is_draft(self):
        return self.status == self.Status.DRAFT

    @property
    def is_submitted(self):
        return self.status == self.Status.SUBMITTED

    def update_aggregations(self):
        """
        Update cached aggregation fields from tranches.
        Called when tranches are saved/updated.
        """
        tranches = self.tranches.all()

        aggregates = tranches.aggregate(
            odp_approved=Sum("odp_phaseout_approved"),
            odp_actual=Sum("odp_phaseout_actual"),
            hfc_approved=Sum("hfc_phasedown_approved"),
            hfc_actual=Sum("hfc_phasedown_actual"),
            enterprises=Sum("number_of_enterprises"),
            funding_approved=Sum("funds_approved"),
            funding_disbursed=Sum("funds_disbursed"),
        )

        self.total_odp_approved = aggregates["odp_approved"]
        self.total_odp_actual = aggregates["odp_actual"]
        self.total_hfc_approved = aggregates["hfc_approved"]
        self.total_hfc_actual = aggregates["hfc_actual"]
        self.total_enterprises = aggregates["enterprises"]
        self.total_funding_approved = aggregates["funding_approved"]
        self.total_funding_disbursed = aggregates["funding_disbursed"]

        if self.total_funding_approved and self.total_funding_disbursed:
            self.total_funding_returned = (
                self.total_funding_approved - self.total_funding_disbursed
            )

        # Calculate total trainees (need to sum from trainee records)
        trainee_count = 0
        for tranche in tranches:
            trainee_count += (
                tranche.trainees.aggregate(total=Sum("count"))["total"] or 0
            )
        self.total_trainees = trainee_count

        self.save(
            update_fields=[
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
        )


class PCRAgencyReport(models.Model):
    """
    Agency-specific section of a PCR.
    Similar to AnnualAgencyProjectReport in APR system.

    Each agency involved in a project can contribute data,
    but only the Lead Agency can submit the report.
    """

    class ReportStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"

    pcr = models.ForeignKey(
        ProjectCompletionReport, on_delete=models.CASCADE, related_name="agency_reports"
    )
    agency = models.ForeignKey(Agency, on_delete=models.PROTECT)

    # Status - only relevant for Lead Agency
    status = models.CharField(
        max_length=20,
        choices=ReportStatus.choices,
        default=ReportStatus.DRAFT,
        help_text="Status of this agency's section (Lead Agency only)",
    )
    is_lead_agency = models.BooleanField(
        default=False, help_text="True if this is the lead agency for the project"
    )
    is_unlocked = models.BooleanField(
        default=False, help_text="MLFS can unlock submitted reports for corrections"
    )

    # Financial summary for this agency (aggregated from tranches)
    funding_approved = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="MLF funding approved for this agency (US$)",
    )
    funding_disbursed = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="MLF funding disbursed by this agency (US$)",
    )
    funding_returned = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="MLF funding returned (Approved - Disbursed)",
    )

    # Audit fields
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_pcr_agency_reports",
        null=True,
        blank=True,
    )
    last_modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="modified_pcr_agency_reports",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    date_submitted = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "PCR Agency Report"
        verbose_name_plural = "PCR Agency Reports"
        unique_together = [["pcr", "agency"]]

    def __str__(self):
        return f"{self.pcr} - {self.agency.name}"

    @property
    def can_edit(self):
        """Check if this agency report can be edited"""
        if self.is_lead_agency:
            return self.status == self.ReportStatus.DRAFT or self.is_unlocked
        # Cooperating agencies can edit while PCR is draft
        return self.pcr.is_draft

    def update_financial_summary(self):
        """Update financial summary from tranches for this agency"""
        tranches = self.pcr.tranches.filter(agency=self.agency)
        aggregates = tranches.aggregate(
            approved=Sum("funds_approved"),
            disbursed=Sum("funds_disbursed"),
        )

        self.funding_approved = aggregates["approved"]
        self.funding_disbursed = aggregates["disbursed"]
        if self.funding_approved and self.funding_disbursed:
            self.funding_returned = self.funding_approved - self.funding_disbursed

        self.save(
            update_fields=["funding_approved", "funding_disbursed", "funding_returned"]
        )


# Section 2 - Project Results


class PCRProjectActivity(models.Model):
    """
    Section 2.1: Implementation Effectiveness - Achievement of Activity Output
    Multi-entry per agency.
    """

    agency_report = models.ForeignKey(
        PCRAgencyReport, on_delete=models.CASCADE, related_name="activities"
    )

    # Pre-filled from project data
    project_type = models.CharField(max_length=100, blank=True, null=True)
    sector = models.CharField(max_length=100, blank=True, null=True)

    # User input
    activity_type = models.TextField(
        help_text="Type of activity (150-250 words suggested)"
    )
    planned_outputs = models.TextField(
        help_text="Planned output(s) (150-250 words suggested)"
    )
    actual_outputs = models.TextField(
        help_text="Actual activity output(s) (150-250 words suggested)"
    )
    additional_remarks = models.TextField(
        blank=True, null=True, help_text="Additional remarks (150-250 words suggested)"
    )

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "PCR Project Activity"
        verbose_name_plural = "PCR Project Activities"
        ordering = ["date_created"]

    def __str__(self):
        return f"{self.agency_report} - {self.activity_type[:50]}"


class PCROverallAssessment(models.Model):
    """
    Section 2.2: Overall Assessment - Achievement of Project Objective
    One per agency.
    """

    class Rating(models.TextChoices):
        HIGHLY_SATISFACTORY = "highly_satisfactory", "Highly satisfactory"
        SATISFACTORY_PLANNED = "satisfactory_planned", "Satisfactory as planned"
        SATISFACTORY_NOT_PLANNED = (
            "satisfactory_not_planned",
            "Satisfactory but not as planned",
        )
        UNSATISFACTORY = "unsatisfactory", "Unsatisfactory"
        OTHER = "other", "Other, please specify"

    agency_report = models.OneToOneField(
        PCRAgencyReport, on_delete=models.CASCADE, related_name="overall_assessment"
    )

    rating = models.CharField(
        max_length=50,
        choices=Rating.choices,
        help_text="Choose the rating from the list",
    )
    rating_other = models.TextField(
        blank=True, null=True, help_text="Specify if rating is 'Other'"
    )
    rating_explanation = models.TextField(
        help_text="Please explain your rating (150-250 words suggested)"
    )

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "PCR Overall Assessment"
        verbose_name_plural = "PCR Overall Assessments"

    def __str__(self):
        return f"{self.agency_report} - {self.get_rating_display()}"


class PCRComment(models.Model):
    """
    Section 2.3 and other comments throughout the PCR.
    Multi-entry per section/entity.
    """

    class EntityType(models.TextChoices):
        LEAD_AGENCY = "lead_agency", "Lead agency"
        COOPERATING_AGENCY = "cooperating_agency", "Cooperating agency"
        GOVERNMENT_NOU = "government_nou", "Government/NOU"
        ENTERPRISES = "enterprises", "Enterprises"
        CONSULTANTS = "consultants", "Consultants"
        SECRETARIAT = (
            "secretariat",
            "Project management officers in the Multilateral Fund Secretariat",
        )
        OTHER = "other", "Other, please specify"

    class Section(models.TextChoices):
        OVERVIEW = "overview", "Overview"
        PROJECT_RESULTS = "project_results", "Project results"
        CAUSES_DELAY = "causes_delay", "Causes of delay"
        LESSONS_LEARNED = "lessons_learned", "Lessons learned"
        GENDER = "gender", "Gender mainstreaming"
        SDGS = "sdgs", "SDGs contribution"
        SUMMARY_DATA = "summary_data", "Summary of key data"

    pcr = models.ForeignKey(
        ProjectCompletionReport,
        on_delete=models.CASCADE,
        related_name="comments",
        null=True,
        blank=True,
    )
    agency_report = models.ForeignKey(
        PCRAgencyReport,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="comments",
        help_text="Optional - link to specific agency report",
    )

    section = models.CharField(
        max_length=50,
        choices=Section.choices,
        help_text="Section this comment relates to",
    )
    entity_type = models.CharField(
        max_length=50,
        choices=EntityType.choices,
        help_text="Entity providing the comment",
    )
    entity_type_other = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Specify if entity type is 'Other'",
    )
    comment_text = models.TextField(help_text="Comment text (150-250 words suggested)")

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "PCR Comment"
        verbose_name_plural = "PCR Comments"
        ordering = ["section", "date_created"]

    def __str__(self):
        return f"{self.pcr} - {self.get_section_display()} - {self.get_entity_type_display()}"


# Section 3 - Causes of Delay


class PCRCauseOfDelay(models.Model):
    """
    Section 3: Causes of Delays and Action Taken
    Multi-entry per agency with multi-select categories.
    """

    agency_report = models.ForeignKey(
        PCRAgencyReport, on_delete=models.CASCADE, related_name="causes_of_delay"
    )

    project_element = models.ForeignKey(
        PCRProjectElement,
        on_delete=models.PROTECT,
        help_text="Project element/component experiencing delays",
    )

    description = models.TextField(
        help_text="Description of causes and action taken (150-250 words suggested)"
    )

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "PCR Cause of Delay"
        verbose_name_plural = "PCR Causes of Delay"
        ordering = ["date_created"]

    def __str__(self):
        return f"{self.agency_report} - {self.project_element}"


class PCRCauseOfDelayCategory(models.Model):
    """
    Through table for many-to-many relationship between
    PCRCauseOfDelay and DelayCategory with per-category description.
    """

    cause_of_delay = models.ForeignKey(
        PCRCauseOfDelay, on_delete=models.CASCADE, related_name="categories"
    )
    category = models.ForeignKey(DelayCategory, on_delete=models.PROTECT)
    category_description = models.TextField(
        blank=True, null=True, help_text="Description specific to this delay category"
    )

    class Meta:
        verbose_name = "PCR Cause of Delay Category"
        verbose_name_plural = "PCR Cause of Delay Categories"
        unique_together = [["cause_of_delay", "category"]]

    def __str__(self):
        return f"{self.cause_of_delay.project_element} - {self.category}"


# Section 4 - Lessons Learned


class PCRLessonLearned(models.Model):
    """
    Section 4: Lessons Learned
    Multi-entry per agency with multi-select categories.
    """

    agency_report = models.ForeignKey(
        PCRAgencyReport, on_delete=models.CASCADE, related_name="lessons_learned"
    )

    project_element = models.ForeignKey(
        PCRProjectElement,
        on_delete=models.PROTECT,
        help_text="Project element/component for this lesson",
    )

    description = models.TextField(
        help_text="Description of lesson learned (150-250 words suggested)"
    )

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "PCR Lesson Learned"
        verbose_name_plural = "PCR Lessons Learned"
        ordering = ["date_created"]

    def __str__(self):
        return f"{self.agency_report} - {self.project_element}"


class PCRLessonLearnedCategory(models.Model):
    """
    Through table for many-to-many relationship between
    PCRLessonLearned and LearnedLessonCategory with per-category description.
    """

    lesson_learned = models.ForeignKey(
        PCRLessonLearned, on_delete=models.CASCADE, related_name="categories"
    )
    category = models.ForeignKey(LearnedLessonCategory, on_delete=models.PROTECT)
    category_description = models.TextField(
        blank=True, null=True, help_text="Description specific to this lesson category"
    )

    class Meta:
        verbose_name = "PCR Lesson Learned Category"
        verbose_name_plural = "PCR Lesson Learned Categories"
        unique_together = [["lesson_learned", "category"]]

    def __str__(self):
        return f"{self.lesson_learned.project_element} - {self.category}"


class PCRRecommendation(models.Model):
    """
    Section 4.2: Recommendations for Future Project Design and Implementation
    """

    pcr = models.ForeignKey(
        ProjectCompletionReport,
        on_delete=models.CASCADE,
        related_name="recommendations",
        null=True,
        blank=True,
    )
    agency_report = models.ForeignKey(
        PCRAgencyReport,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="recommendations",
        help_text="Optional - link to specific agency",
    )

    recommendation_text = models.TextField(
        help_text=(
            "Recommendations for future project design and "
            "implementation (150-250 words suggested)"
        )
    )

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "PCR Recommendation"
        verbose_name_plural = "PCR Recommendations"
        ordering = ["date_created"]

    def __str__(self):
        return f"{self.pcr} - Recommendation"


# Section 5 - Gender Mainstreaming


class PCRGenderMainstreaming(models.Model):
    """
    Section 5: Gender Mainstreaming
    Pre-filled from progress reports with qualitative description.
    """

    agency_report = models.ForeignKey(
        PCRAgencyReport, on_delete=models.CASCADE, related_name="gender_mainstreaming"
    )

    phase = models.ForeignKey(
        PCRGenderPhase, on_delete=models.PROTECT, help_text="Gender mainstreaming phase"
    )

    # Pre-filled from progress report
    indicator_met = models.BooleanField(
        help_text="Yes/No indicator from progress report"
    )

    # User input
    qualitative_description = models.TextField(
        help_text="Qualitative description (150-250 words suggested)"
    )

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "PCR Gender Mainstreaming"
        verbose_name_plural = "PCR Gender Mainstreaming"
        unique_together = [["agency_report", "phase"]]

    def __str__(self):
        return f"{self.agency_report} - {self.phase}"


# Section 6 - SDG Contributions


class PCRSDGContribution(models.Model):
    """
    Section 6: Contribution to Sustainable Development Goals
    Optional, multi-entry per agency.
    """

    agency_report = models.ForeignKey(
        PCRAgencyReport, on_delete=models.CASCADE, related_name="sdg_contributions"
    )

    sdg = models.ForeignKey(PCRSDG, on_delete=models.PROTECT, help_text="SDG goal")

    description = models.TextField(
        help_text="Description of contribution to this SDG (150-250 words suggested)"
    )

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "PCR SDG Contribution"
        verbose_name_plural = "PCR SDG Contributions"
        ordering = ["sdg__number"]

    def __str__(self):
        return f"{self.agency_report} - {self.sdg}"


# Section 7 - Tranches


class PCRTrancheData(models.Model):
    """
    Section 7: Summary of Key Data on Project Implementation and Delays
    Detailed data per project/tranche.
    Maps to rows in the "Summary of Key Data" sheet.
    """

    pcr = models.ForeignKey(
        ProjectCompletionReport, on_delete=models.CASCADE, related_name="tranches"
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        help_text="The specific project/tranche this data represents",
    )
    agency = models.ForeignKey(Agency, on_delete=models.PROTECT)

    # Pre-filled from project data
    project_code = models.CharField(max_length=100)
    project_type = models.CharField(max_length=100, blank=True, null=True)
    sector = models.CharField(max_length=100, blank=True, null=True)
    tranche_number = models.IntegerField(null=True, blank=True)
    date_approved = models.DateField()
    actual_date_completion = models.DateField(null=True, blank=True)
    funds_approved = models.DecimalField(
        max_digits=15, decimal_places=2, help_text="Funds approved (US$)"
    )
    odp_phaseout_approved = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="ODP phase-out approved",
    )
    odp_phaseout_actual = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="ODP phase-out actual",
    )
    hfc_phasedown_approved = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="HFCs phased-down CO2-eq tonnes approved",
    )
    hfc_phasedown_actual = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="HFCs phased-down CO2-eq tonnes actual",
    )

    # User input fields
    funds_disbursed = models.DecimalField(
        max_digits=15, decimal_places=2, help_text="Funds disbursed (US$)"
    )
    planned_completion_date = models.DateField(help_text="Planned date of completion")

    # Auto-calculated fields
    planned_duration_months = models.IntegerField(
        null=True,
        blank=True,
        help_text="Calculated: planned_completion_date - date_approved",
    )
    actual_duration_months = models.IntegerField(
        null=True,
        blank=True,
        help_text="Calculated: actual_date_completion - date_approved",
    )
    delay_months = models.IntegerField(
        null=True,
        blank=True,
        help_text="Calculated: planned_completion_date - actual_date_completion",
    )

    # Enterprise data (simplified - detailed entries in separate model)
    number_of_enterprises = models.IntegerField(
        default=0, help_text="Total number of enterprises"
    )

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "PCR Tranche Data"
        verbose_name_plural = "PCR Tranche Data"
        unique_together = [["pcr", "project"]]

    def __str__(self):
        return f"{self.pcr} - {self.project_code}"

    def save(self, *args, **kwargs):
        """Calculate duration and delay fields on save"""
        if self.date_approved and self.planned_completion_date:
            delta = (self.planned_completion_date - self.date_approved).days
            # TODO: Approximate - maybe we can find a better way
            self.planned_duration_months = round(delta / 30)

        if self.date_approved and self.actual_date_completion:
            delta = (self.actual_date_completion - self.date_approved).days
            self.actual_duration_months = round(delta / 30)

        if self.planned_completion_date and self.actual_date_completion:
            delta = (self.planned_completion_date - self.actual_date_completion).days
            self.delay_months = round(delta / 30)

        super().save(*args, **kwargs)

    @classmethod
    def create_from_project(cls, pcr, project, agency):
        """
        Create a PCRTrancheData entry from a Project.
        Pre-fills fields from project data.
        """
        # Create or get existing tranche data
        tranche, _ = cls.objects.get_or_create(
            pcr=pcr,
            project=project,
            defaults={
                "agency": agency,
                "project_code": getattr(project, "code", "") or "",
                "project_type": str(getattr(project, "project_type", "")),
                "sector": str(getattr(project, "sector", "")),
                "tranche_number": getattr(project, "tranche_number", None),
                "date_approved": getattr(project, "date_approved", None)
                or date.today(),
                "funds_approved": getattr(project, "funds_approved", 0) or 0,
                "funds_disbursed": getattr(project, "funds_approved", 0)
                or 0,  # Default to approved
                "planned_completion_date": getattr(project, "date_comp_plan", None)
                or getattr(project, "date_completion", None)
                or date.today(),
                "created_by_id": None,
            },
        )
        return tranche


class PCRAlternativeTechnology(models.Model):
    """
    Alternative technologies used - multi-entry per tranche.
    Substance conversion tracking.
    """

    tranche = models.ForeignKey(
        PCRTrancheData, on_delete=models.CASCADE, related_name="technologies"
    )

    substance_from = models.ForeignKey(
        Substance,
        on_delete=models.PROTECT,
        related_name="pcr_conversion_from",
        help_text="Substance converted from",
    )
    substance_to = models.ForeignKey(
        Substance,
        on_delete=models.PROTECT,
        related_name="pcr_conversion_to",
        help_text="Substance converted to",
    )

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "PCR Alternative Technology"
        verbose_name_plural = "PCR Alternative Technologies"

    def __str__(self):
        return f"{self.tranche} - {self.substance_from} → {self.substance_to}"


class PCREnterprise(models.Model):
    """
    Enterprise details - multi-entry per tranche.
    """

    tranche = models.ForeignKey(
        PCRTrancheData, on_delete=models.CASCADE, related_name="enterprises"
    )

    address = models.TextField(help_text="Enterprise address and details")

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "PCR Enterprise"
        verbose_name_plural = "PCR Enterprises"

    def __str__(self):
        return f"{self.tranche} - Enterprise"


class PCRTraineeCount(models.Model):
    """
    Training data - gender-disaggregated trainee counts per tranche.
    """

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"

    tranche = models.ForeignKey(
        PCRTrancheData, on_delete=models.CASCADE, related_name="trainees"
    )

    gender = models.CharField(max_length=10, choices=Gender.choices)
    count = models.IntegerField(default=0, help_text="Number of trainees")

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "PCR Trainee Count"
        verbose_name_plural = "PCR Trainee Counts"
        unique_together = [["tranche", "gender"]]

    def __str__(self):
        return f"{self.tranche} - {self.count} {self.get_gender_display()} trainees"


class PCREquipmentDisposal(models.Model):
    """
    ODS-based production equipment disposal - optional, multi-entry per tranche.
    """

    tranche = models.ForeignKey(
        PCRTrancheData, on_delete=models.CASCADE, related_name="equipment_disposals"
    )

    equipment_name = models.CharField(
        max_length=200, help_text="Name of equipment rendered unusable"
    )
    description = models.TextField(help_text="Description (150-250 words suggested)")
    disposal_type = models.CharField(max_length=100, help_text="Disposal method")
    disposal_date = models.DateField()

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
        null=True,
        blank=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "PCR Equipment Disposal"
        verbose_name_plural = "PCR Equipment Disposals"

    def __str__(self):
        return f"{self.tranche} - {self.equipment_name}"


# Section 8 - Supporting Evidence


class PCRSupportingEvidence(models.Model):
    """
    Section 8: Other Supporting Evidence
    File attachments and links related to PCR sections.
    """

    class RelatedSection(models.TextChoices):
        OVERVIEW = "overview", "Overview"
        PROJECT_RESULTS = "project_results", "Project results"
        CAUSES_DELAY = "causes_delay", "Causes of delay"
        LESSONS_LEARNED = "lessons_learned", "Lessons learned"
        GENDER = "gender", "Gender mainstreaming"
        SDGS = "sdgs", "SDGs contribution"
        SUMMARY_DATA = (
            "summary_data",
            "Summary of key data on project and implementation delay",
        )

    pcr = models.ForeignKey(
        ProjectCompletionReport,
        on_delete=models.CASCADE,
        related_name="supporting_evidence",
    )

    # File or URL (one must be provided)
    file = models.FileField(
        storage=get_protected_storage,
        upload_to="pcr_evidence/",
        blank=True,
        null=True,
        help_text="Upload document, photo, or file",
    )
    url = models.URLField(
        blank=True, null=True, help_text="Or provide link to website/repository"
    )

    related_section = models.CharField(
        max_length=50,
        choices=RelatedSection.choices,
        help_text="PCR section this evidence relates to",
    )
    description = models.TextField(
        blank=True, null=True, help_text="Description of the evidence"
    )

    # Audit
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )
    date_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "PCR Supporting Evidence"
        verbose_name_plural = "PCR Supporting Evidence"
        ordering = ["related_section", "date_created"]

    def __str__(self):
        if self.file:
            return f"{self.pcr} - File: {self.file.name}"
        return f"{self.pcr} - URL: {self.url}"
