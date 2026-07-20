from django.db import models
from django.utils.functional import cached_property

from core.models.agency import Agency
from core.models.project import MetaProject
from core.models.meeting import Decision
from core.models.substance import Substance
from core.models.utils import get_protected_storage


class PCRManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(latest_pcr__isnull=True)

    def really_all(self):
        return super().get_queryset()


class PCR(models.Model):
    """
    The PCR should give information specific to one metacode, but this model contains
    information specific to one project of that metacode.
    """

    meta_project = models.ForeignKey("MetaProject", on_delete=models.PROTECT)
    version = models.IntegerField(default=1)
    latest_pcr = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="previous_versions",
    )
    decisions = models.ManyToManyField(
        Decision, related_name="pcrs", help_text="Executive Commitee meeting"
    )
    project_date_approved = models.DateField(
        null=True, blank=True, help_text="Date of approval of the project"
    )
    project_date_completion = models.DateField(
        null=True, blank=True, help_text="Date of completion of the project"
    )
    phase_out_ods_approved = models.DecimalField(
        max_digits=30,
        decimal_places=15,
        null=True,
        blank=True,
        help_text="ODP phase-out (Approved)",
    )
    phase_out_ods_actual = models.DecimalField(
        max_digits=30,
        decimal_places=15,
        null=True,
        blank=True,
        help_text="ODP phase out (Actual)",
    )
    phase_out_co2_eq_t_approved = models.DecimalField(
        max_digits=30,
        decimal_places=15,
        null=True,
        blank=True,
        help_text="HFCs PHASED-DOWN (CO2 eq-tonnes) (Approved)",
    )
    phase_out_co2_eq_t_actual = models.DecimalField(
        max_digits=30,
        decimal_places=15,
        null=True,
        blank=True,
        help_text="HFCs PHASED-DOWN (CO2 eq-tonnes) (Actual)",
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    submission_date = models.DateField(null=True, blank=True)
    objects = PCRManager()

    def __str__(self):
        return self.meta_project.umbrella_code

    @cached_property
    def total_number_of_enterprises(self):
        return sum(
            (pcr_project.enterprises.count() for pcr_project in self.pcr_projects.all())
        )

    class Meta:
        verbose_name_plural = "PCR"


class PCRProject(models.Model):
    """
    Holds PCR information that is specific to a single project.
    The PCR should give information specific to one metacode, but this model contains
    information specific to one project of that metacode.
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

    pcr = models.ForeignKey(
        "PCR", on_delete=models.PROTECT, related_name="pcr_projects"
    )
    project = models.OneToOneField(
        "Project", on_delete=models.PROTECT, related_name="pcr_project"
    )

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
    funds_disbursed = models.DecimalField(
        max_digits=30,
        decimal_places=15,
        null=True,
        blank=True,
        help_text="Funds disbursed entered in the PCR summary of key data.",
    )
    planned_date_of_completion = models.DateField(null=True, blank=True)
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
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "PCR projects"

    def __str__(self):
        return f"{self.pcr.meta_project.umbrella_code}"


class PCRProjectAlternativeTechnology(models.Model):
    pcr_project = models.ForeignKey(
        "PCRProject", on_delete=models.CASCADE, related_name="alternative_technologies"
    )
    substance_from = models.ForeignKey(
        Substance,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="+",
    )
    substance_to = models.ForeignKey(
        Substance,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="+",
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "PCR project alternative technologies"

    def __str__(self):
        return f"{self.pcr_project} - {self.substance_from} to {self.substance_to}"


class PCRProjectEnterprise(models.Model):
    pcr_project = models.ForeignKey(
        "PCRProject", on_delete=models.CASCADE, related_name="enterprises"
    )
    name = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "PCR project enterprises"

    def __str__(self):
        return f"{self.pcr_project} - {self.name}"


class PCRProjectEquipment(models.Model):
    pcr_project = models.ForeignKey(
        "PCRProject", on_delete=models.CASCADE, related_name="equipments"
    )
    name = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    disposal_type = models.PositiveSmallIntegerField(null=True, blank=True)
    disposal_date = models.DateField(null=True, blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "PCR project equipment"

    def __str__(self):
        return f"{self.pcr_project} - {self.name}"


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

    pcr_project = models.ForeignKey(
        "PCRProject", on_delete=models.PROTECT, related_name="additional_comments"
    )
    entity = models.CharField(
        max_length=64,
        choices=Entity.choices,
        help_text="Indicate whether the financial figures are provisional or final",
    )
    comment = models.TextField(blank=True, null=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "PCR additional comments"

    def __str__(self):
        return f"{self.pcr_project.pcr.meta_project.umbrella_code} - {self.pcr_project.project}"


class PCRActivity(models.Model):
    pcr = models.ForeignKey("PCR", on_delete=models.PROTECT, related_name="activities")
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
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "PCR activities"

    def __str__(self):
        return f"{self.pcr} - {self.type_of_activity}"


class PCRProjectComponentOptionManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(obsolete=False)

    def really_all(self):
        return super().get_queryset()


class PCRProjectComponentOption(models.Model):
    name = models.CharField(max_length=256)
    sort_order = models.FloatField(null=True, blank=True)
    obsolete = models.BooleanField(default=False)

    objects = PCRProjectComponentOptionManager()

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "PCR project component options"


class PCRDelayCategoryManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(obsolete=False)

    def really_all(self):
        return super().get_queryset()


class PCRDelayCategory(models.Model):
    name = models.CharField(max_length=256)
    sort_order = models.FloatField(null=True, blank=True)
    obsolete = models.BooleanField(default=False)

    objects = PCRDelayCategoryManager()

    class Meta:
        verbose_name_plural = "PCR delay categories"

    def __str__(self):
        return self.name


class PCRAgency(models.Model):
    pcr = models.ForeignKey(PCR, on_delete=models.PROTECT, related_name="agencies")
    agency = models.ForeignKey(Agency, on_delete=models.PROTECT)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("pcr", "agency")
        verbose_name_plural = "PCR agencies"

    def __str__(self):
        return f"{self.pcr.meta_project.umbrella_code} - {self.agency}"


class PCRProjectComponent(models.Model):
    pcr_agency = models.ForeignKey(
        PCRAgency, on_delete=models.PROTECT, related_name="components"
    )
    project_component_option = models.ForeignKey(
        PCRProjectComponentOption, on_delete=models.PROTECT
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "PCR project components"

    def __str__(self):
        return f"{self.pcr_agency.pcr.meta_project.umbrella_code} - {self.project_component_option.name}"


class PCRDelayCause(models.Model):
    pcr_project_component = models.ForeignKey(
        PCRProjectComponent, on_delete=models.PROTECT, related_name="delay_causes"
    )
    delay = models.ForeignKey("PCRDelayCategory", on_delete=models.PROTECT)
    description = models.TextField(blank=True, null=True, help_text="Planned output(s)")
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.pcr_project_component.pcr_agency.pcr.meta_project.umbrella_code} - {self.delay}"

    class Meta:
        verbose_name_plural = "PCR delay causes"


class PCRLearnedLessonCategoryManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(obsolete=False)

    def really_all(self):
        return super().get_queryset()


class PCRLearnedLessonCategory(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.FloatField(null=True, blank=True)
    obsolete = models.BooleanField()

    objects = PCRLearnedLessonCategoryManager()

    class Meta:
        verbose_name_plural = "PCR learned lesson categories"

    def __str__(self):
        return self.name


class PCRLearnedLesson(models.Model):
    pcr_project_component = models.ForeignKey(
        PCRProjectComponent, on_delete=models.PROTECT, related_name="learned_lessons"
    )
    lesson = models.ForeignKey(PCRLearnedLessonCategory, on_delete=models.PROTECT)
    description = models.TextField(
        blank=True, null=True, help_text="Description of the causes of delay selected "
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "PCR learned lessons"


class PCRGenderMainstreaming(models.Model):
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
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "PCR gender mainstreamings"


class PCRGoal(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.FloatField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "PCR goals"

    def __str__(self):
        return self.name


class PCRSustainableDevelopmentGoal(models.Model):
    pcr_agency = models.ForeignKey(
        PCRAgency,
        on_delete=models.PROTECT,
        related_name="sustainable_development_goals",
    )
    goals = models.ManyToManyField(
        PCRGoal,
        through="PCRSustainableDevelopmentGoalDescription",
        related_name="sustainable_development_goals",
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "PCR sustainable development goals"

    def __str__(self):
        return f"{self.pcr_agency.pcr.meta_project.umbrella_code} - {self.pcr_agency.agency.name}"


class PCRSustainableDevelopmentGoalDescription(models.Model):
    goal = models.ForeignKey(PCRGoal, on_delete=models.PROTECT)
    sgr = models.ForeignKey(PCRSustainableDevelopmentGoal, on_delete=models.PROTECT)
    description = models.TextField(null=True, blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)


class PCRSupportingEvidenceSection(models.Model):
    code = models.CharField(max_length=10, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.FloatField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "PCR supporting evidence sections"

    def __str__(self):
        return self.name


class PCRSupportingEvidence(models.Model):
    pcr_agency = models.ForeignKey(
        PCRAgency, on_delete=models.PROTECT, related_name="supporting_evidences"
    )
    section = models.ForeignKey(
        PCRSupportingEvidenceSection,
        on_delete=models.PROTECT,
        related_name="supporting_evidences",
    )
    file = models.FileField(
        storage=get_protected_storage,
        upload_to="pcr_files/",
    )
    filename = models.CharField(max_length=100)
    link = models.URLField(blank=True, null=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "PCR supporting evidences"


class OLD_DelayCategory(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.FloatField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "OLD Delay categories"

    def __str__(self):
        return self.name


class OLD_PCRDelayExplanation(models.Model):
    meta_project = models.ForeignKey(MetaProject, on_delete=models.CASCADE)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    category = models.ForeignKey(OLD_DelayCategory, on_delete=models.CASCADE)
    delay_cause = models.TextField(blank=True, null=True)
    measures_to_overcome = models.TextField(blank=True, null=True)
    source_file = models.CharField(max_length=255, blank=True, null=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "OLD PCR Delay categories"


class OLD_LearnedLessonCategory(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.FloatField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "OLD Learned lesson categories"

    def __str__(self):
        return self.name


class OLD_PCRLearnedLessons(models.Model):
    meta_project = models.ForeignKey(MetaProject, on_delete=models.CASCADE)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    category = models.ForeignKey(OLD_LearnedLessonCategory, on_delete=models.CASCADE)
    description = models.TextField(blank=True, null=True)
    source_file = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name_plural = "OLD PCR Learned lessons"


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

    class Meta:
        verbose_name_plural = "OLD PCR Sector"


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
