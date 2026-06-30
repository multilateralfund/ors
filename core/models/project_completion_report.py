from django.db import models
from core.models.agency import Agency

from core.models.project import MetaProject


class PCR(models.Model):
    """
    Project Completion Report
    The complete PCR picture is formed using this model and the ones underneath.
    The PCR should give information specific to one metacode, but this model contains
    information specific to one project of that metacode.
    """

    meta_project = models.ForeignKey("MetaProject", on_delete=models.PROTECT)


class PCRProject(models.Model):
    """
    Holds PCR information that is specific to a single project
    """

    class FinancialFiguresStatus(models.TextChoices):
        PROVISIONAL = "Provisional", "Provisional"
        FINAL = "Final", "Final"

    class ProjectGoalAchieved(models.TextChoices):
        YES = "Yes", "Yes"
        NO = "No", "No"
        NA = "N/A", "N/A"

    class Rating(models.TextChoices):
        HIGHLY_SATISFACTORY = "Highly satisfactory", "Highly satisfactory"
        SATISFACTORY_PLANNED = "Satisfactory as planned", "Satisfactory as planned"
        SATISFACTORY_NOT_PLANNED = (
            "Satisfactory but not as planned",
            "Satisfactory but not as planned",
        )
        UNSATISFACTORY = "Unsatisfactory", "Unsatisfactory"
        OTHER = "Other, please specify", "Other, please specify"

    class CompletedBy(models.TextChoices):
        LEAD_AGENCY = "Lead Agency", "Lead Agency"
        COOPERATING_AGENCY = "Cooperating Agency", "Cooperating Agency"
        NATIONAL_COORDINATING_AGENCY = (
            "National coordinating agency/NOU",
            "National coordinating agency/NOU",
        )
        LOCAL_EXECUTING_AGENCY = "Local executing agency", "Local executing agency"
        OTHER = "Other", "Other"

    pcr = models.ForeignKey("PCR", on_delete=models.PROTECT)
    project = models.ForeignKey("Project", on_delete=models.PROTECT)

    # TODO the following fields can either be calculated/retrieved from project or should be cached/denormalized.

    # country - from project
    # metacode - from project
    # executive_committee_meeting - Relevant Decision(s) from project
    # project_date_approved - Date of approval of the project
    # project_date_completion - Approved
    # Date of completion of the project:
    # ODP phase-out (Approved)
    # ODP phase out (Actual)
    # HFCs PHASED‑DOWN (CO2 eq‑tonnes) (Approved)
    # HFCs PHASED‑DOWN (CO2 eq‑tonnes) (Actual)
    # HFCs PHASED‑DOWN (CO2 eq‑tonnes) (Approved)
    # Conversion/alternative technology used:
    # Number of enterprises
    # Total number of trainees (e.g technicians)*
    # MLF funding approved
    # MLF funding disbursed
    # MLF funding retunrned
    # Total MLF funding approved
    # Total MLF funding disbursed
    # Total project (metacode) MLF funding retunrned

    financial_figures_status = models.CharField(
        max_length=32,
        choices=FinancialFiguresStatus.choices,
        help_text="Indicate whether the financial figures are provisional or final",
    )
    financial_figures_status_explanation = models.TextField(
        null=True,
        blank=True,
        help_text="Explanations if needed ( sub-section of row above)",
    )
    addresses = models.TextField(
        null=True,
        blank=True,
        help_text="Address(es) of enterprise(s) and project site(s), if applicable.",
    )
    project_goal_achieved = models.CharField(
        max_length=16,
        choices=ProjectGoalAchieved.choices,
        help_text="Indicate whether the financial figures are provisional or final",
    )
    project_goal_achieved_explanation = models.TextField(
        null=True,
        blank=True,
        help_text="If project goal achieved is No, this field provides a brief explanation",
    )
    rating = models.CharField(
        max_length=64,
        choices=Rating.choices,
    )
    rating_explaination = models.TextField(
        null=True,
        blank=True,
        help_text="Should be filled if rating has the value 'Other, please specify' ",
    )
    completed_by = models.CharField(
        max_length=64,
        choices=CompletedBy.choices,
        help_text="Completion report done by...",
    )


class PCRAdditionalComment(models.Model):
    """
    As part of the submitter user information of the PCR, the user can input
    comments on behalf of multiple entities (Cooperating agencies/Enterprises/Consultants)
    """

    class Entity(models.TextChoices):
        COOPERATING_AGENCY = "Cooperating agency", "Cooperating agency"
        GOVERNMENT_NOU = "Government/NOU", "Government/NOU"
        ENTERPRISES = "Enterprises", "Enterprises"
        CONSULTANTS = "Consultants", "Consultants"
        PROJECT_MANAGEMENT_OFFICERS = (
            "Project management officers in the Multilateral Fund Secretariat",
            "Project management officers in the Multilateral Fund Secretariat",
        )
        OTHER = "Other, please specify", "Other, please specify"

    pcr_project = models.ForeignKey("PCRProject", on_delete=models.PROTECT)
    entity = models.CharField(
        max_length=64,
        choices=Entity.choices,
        help_text="Indicate whether the financial figures are provisional or final",
    )
    comment = models.TextField(blank=True, null=True)


class PCRActivity(models.Model):
    pcr = models.ForeignKey("PCR", on_delete=models.PROTECT)
    type_of_activity = models.TextField(
        blank=True, null=True, help_text="Type of activity"
    )
    planned_output = models.TextField(
        blank=True, null=True, help_text="Planned output(s)"
    )
    actual_activity_output = models.TextField(
        blank=True, null=True, help_text="Actual activity output(s)"
    )
    additional_remarks = models.TextField(
        blank=True, null=True, help_text="Additional remarks"
    )


class OLD_PCRSector(models.Model):
    class PCRSectorType(models.TextChoices):
        INVESTMENT = 1, "Investment"
        NONINVESTMENT = 2, "Non-investment"

    name = models.CharField(max_length=255, blank=True, null=True)
    sector_type = models.CharField(
        max_length=255, choices=PCRSectorType.choices, blank=True, null=True
    )

    def __str__(self):
        return self.name


class OLD_PCRActivity(models.Model):
    """
    This is the old model used in the initial data import. TBD if the information from here
    will be migrated to PCRActivity
    """

    meta_project = models.ForeignKey(MetaProject, on_delete=models.CASCADE)
    sector = models.ForeignKey(OLD_PCRSector, on_delete=models.CASCADE)
    type_of_activity = models.TextField(blank=True, null=True)
    planned_output = models.TextField(blank=True, null=True)
    actual_activity_output = models.TextField(blank=True, null=True)
    evaluation = models.IntegerField(blank=True, null=True)
    explanation = models.TextField(blank=True, null=True)
    source_file = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name_plural = "OLD PCR activities"


class ProjectComponentManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(obsolete=False)

    def really_all(self):
        return super().get_queryset()


class ProjectComponent(models.Model):
    name = models.CharField(max_length=256)
    sort_order = models.FloatField(null=True, blank=True)
    obsolete = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    objects = ProjectComponentManager()


class DelayCategoryManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(obsolete=False)

    def really_all(self):
        return super().get_queryset()


class DelayCategory(models.Model):
    name = models.CharField(max_length=256)
    sort_order = models.FloatField(null=True, blank=True)
    obsolete = models.BooleanField(default=False)

    objects = DelayCategoryManager()


class PCRAgency(models.Model):
    pcr = models.ForeignKey(PCR, on_delete=models.PROTECT, related_name="agencies")
    agency = models.ForeignKey(Agency, on_delete=models.PROTECT)

    class Meta:
        unique_together = ("pcr", "agency")


class PCRProjectComponent(models.Model):
    pcr_agency = models.ForeignKey(
        PCRAgency, on_delete=models.PROTECT, related_name="components"
    )
    project_component = models.ForeignKey(ProjectComponent, on_delete=models.PROTECT)


class DelayCause(models.Model):
    pcr_project_component = models.ForeignKey(
        PCRProjectComponent, on_delete=models.PROTECT
    )
    delay = models.ForeignKey("DelayCategory", on_delete=models.PROTECT)
    description = models.TextField(blank=True, null=True, help_text="Planned output(s)")


class OLD_DelayCategory(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.FloatField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "Delay categories"

    def __str__(self):
        return self.name


class OLD_PCRDelayExplanation(models.Model):
    meta_project = models.ForeignKey(MetaProject, on_delete=models.CASCADE)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    category = models.ForeignKey(OLD_DelayCategory, on_delete=models.CASCADE)
    delay_cause = models.TextField(blank=True, null=True)
    measures_to_overcome = models.TextField(blank=True, null=True)
    source_file = models.CharField(max_length=255, blank=True, null=True)


class LessonsLearnedCategoryManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(obsolete=False)

    def really_all(self):
        return super().get_queryset()


class LessonsLearnedCategory(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.FloatField(null=True, blank=True)
    obsolete = models.BooleanField()

    objects = LessonsLearnedCategoryManager()

    class Meta:
        verbose_name_plural = "Learned lesson categories"

    def __str__(self):
        return self.name


class LessonsLearned(models.Model):
    pcr_project_component = models.ForeignKey(
        PCRProjectComponent, on_delete=models.PROTECT
    )
    lesson = models.ForeignKey(LessonsLearnedCategory, on_delete=models.PROTECT)
    description = models.TextField(
        blank=True, null=True, help_text="Description of the causes of delay selected "
    )


class OLD_LearnedLessonCategory(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.FloatField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "Learned lesson categories"

    def __str__(self):
        return self.name


class OLD_PCRLearnedLessons(models.Model):
    meta_project = models.ForeignKey(MetaProject, on_delete=models.CASCADE)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    category = models.ForeignKey(OLD_LearnedLessonCategory, on_delete=models.CASCADE)
    description = models.TextField(blank=True, null=True)
    source_file = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name_plural = "Learned lessons"


class GenderMainstreaming(models.Model):
    class ProjectPreparation(models.TextChoices):
        PROJECT_PREPARATION = "Project preparation", "Project preparation"
        PLANNING = "Planning/Formulation", "Planning/Formulation"
        IMPLEMENTATION = "Implementation", "Implementation"
        MONITORING_AND_REPORTING = (
            "Monitoring and Reporting",
            "Monitoring and Reporting",
        )

    pcr_agency = models.ForeignKey(
        PCRAgency, on_delete=models.PROTECT, related_name="gender_mainstreamings"
    )
    project_preparation = models.CharField(
        max_length=32,
        choices=ProjectPreparation.choices,
        help_text="",
    )
    prefilled = models.BooleanField()
    qualitative_description = models.TextField()


class Goal(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.FloatField(null=True, blank=True)


class SustainableDevelopmentGoal(models.Model):
    pcr_agency = models.ForeignKey(
        PCRAgency,
        on_delete=models.PROTECT,
        related_name="sustainable_development_goals",
    )
    goals = models.ManyToManyField(
        Goal, through="SustainableDevelopmentGoalDescription"
    )


class SustainableDevelopmentGoalDescription(models.Model):
    goal = models.ForeignKey(Goal, on_delete=models.PROTECT)
    sgr = models.ForeignKey(SustainableDevelopmentGoal, on_delete=models.PROTECT)
    description = models.TextField(null=True, blank=True)
