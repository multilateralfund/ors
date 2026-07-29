import os
import shutil
from decimal import Decimal

from django.db import models
from django.db import transaction
from django.apps import apps
from django.conf import settings
from django.utils.functional import cached_property

from core.models.agency import Agency
from core.models.project import MetaProject
from core.models.meeting import Decision
from core.models.substance import Substance
from core.models.utils import get_protected_storage

# pylint: disable=no-member

PCR_RELATED_MODELS = [
    "PCRProject",
    "PCRActivity",
    "PCRAdditionalComment",
    "PCRProjectComponent",
    "PCRGenderMainstreaming",
    "PCRSustainableDevelopmentGoal",
    "PCRSupportingEvidence",
]

PCR_PROJECT_RELATED_MODELS = [
    "PCRProjectAlternativeTechnology",
    "PCRProjectEnterprise",
    "PCRProjectEquipment",
    "PCRAdditionalComment",
]


def _get_new_file_path(original_file_name, new_project_id):
    # Generate a new file path for the duplicated file
    base_dir, file_name = os.path.split(original_file_name)
    new_file_name = f"{file_name}_{new_project_id}"
    return os.path.join(base_dir, new_file_name)


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

    meta_project = models.ForeignKey("MetaProject", on_delete=models.PROTECT)
    version_created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        default=None,
        related_name="created_pcrs_version",
        help_text="User who created this PCR version",
    )
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
    financial_figures_status = models.CharField(
        max_length=32,
        choices=FinancialFiguresStatus.choices,
        blank=True,
        null=True,
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
        blank=True,
        null=True,
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
        blank=True,
        null=True,
        choices=Rating.choices,
    )
    rating_explanation = models.TextField(
        null=True,
        blank=True,
        help_text="Please explain your rating ( sub-section of row above) ",
    )
    rating_explanation_other = models.TextField(
        null=True,
        blank=True,
        help_text="Should be filled if rating has the value 'Other, please specify' ",
    )
    completed_by = models.CharField(
        max_length=64,
        choices=CompletedBy.choices,
        blank=True,
        null=True,
        help_text="Completion report done by...",
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

    @cached_property
    def total_funds_approved(self):
        """Total MLF funding approved"""
        return sum(
            (
                pcr_project.funds_approved or 0
                for pcr_project in self.pcr_projects.all()
            ),
            9,
        )

    @cached_property
    def total_funds_disbursed(self):
        """Total MLF funding disbursed"""
        return sum(
            (
                pcr_project.funds_disbursed or 0
                for pcr_project in self.pcr_projects.all()
            ),
            0,
        )

    @cached_property
    def total_funds_returned(self):
        """Total project (metacode) MLF funding returned"""
        result = sum(
            (
                pcr_project.funds_returned or 0
                for pcr_project in self.pcr_projects.all()
            ),
            0,
        )
        return result

    class Meta:
        verbose_name_plural = "PCR"

    def copy_pcr(self):
        with transaction.atomic():
            new_pcr = PCR.objects.get(pk=self.pk)
            new_pcr.pk = None
            new_pcr.save()

            new_pcr.decisions.set(self.decisions.all())

            for model_name in PCR_RELATED_MODELS:
                model_class = apps.get_model("core", model_name)
                items = model_class.objects.filter(pcr=self)
                for item in items:
                    item.make_copy(new_pcr)

            new_pcr.save()
            return new_pcr

    def increase_version(self, user):
        archived_pcr = self.copy_pcr()
        archived_pcr.latest_pcr = self
        archived_pcr.save()

        self.version += 1
        self.version_created_by = user
        self.save()


class PCRProject(models.Model):
    """
    Holds PCR information that is specific to a single project.
    The PCR should give information specific to one metacode, but this model contains
    information specific to one project of that metacode.
    """

    pcr = models.ForeignKey(
        "PCR", on_delete=models.PROTECT, related_name="pcr_projects"
    )
    project = models.OneToOneField(
        "Project", on_delete=models.PROTECT, related_name="pcr_project"
    )
    funds_disbursed = models.DecimalField(
        max_digits=30,
        decimal_places=15,
        null=True,
        blank=True,
        help_text="Funds disbursed entered in the PCR summary of key data.",
    )
    planned_date_of_completion = models.DateField(null=True, blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "PCR projects"

    def __str__(self):
        return f"{self.pcr.meta_project.umbrella_code}"

    @cached_property
    def funds_approved(self):
        """
        MLF funding approved
        """
        return Decimal(self.project.total_fund or 0)

    @cached_property
    def funds_returned(self):
        """
        MLF funding returned
        """
        return self.funds_approved - (self.funds_disbursed or 0)

    def make_copy(self, new_pcr):
        new_item = self.__class__.objects.get(pk=self.pk)
        new_item.pk = None
        new_item.pcr = new_pcr
        new_item.project = self.project
        new_item.save()
        for model_name in PCR_PROJECT_RELATED_MODELS:
            model_class = apps.get_model("core", model_name)
            items = model_class.objects.filter(pcr_project=self)
            for item in items:
                item.make_copy(new_item)

        return new_item


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

    def make_copy(self, new_pcr_project: "PCRProject"):
        new_item = self.__class__.objects.get(pk=self.pk)
        new_item.pk = None
        new_item.pcr_project = new_pcr_project
        new_item.substance_from = self.substance_from
        new_item.substance_to = self.substance_to
        new_item.save()
        return new_item


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

    def make_copy(self, new_pcr_project: "PCRProject"):
        new_item = self.__class__.objects.get(pk=self.pk)
        new_item.pk = None
        new_item.pcr_project = new_pcr_project
        new_item.save()
        return new_item


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

    def make_copy(self, new_pcr_project: "PCRProject"):
        new_item = self.__class__.objects.get(pk=self.pk)
        new_item.pk = None
        new_item.pcr_project = new_pcr_project
        new_item.save()
        return new_item


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

    pcr = models.ForeignKey(
        "PCR", on_delete=models.PROTECT, related_name="additional_comments"
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
        return f"{self.pcr.meta_project.umbrella_code} - {self.entity}"

    def make_copy(self, new_pcr_project: "PCRProject"):
        new_item = self.__class__.objects.get(pk=self.pk)
        new_item.pk = None
        new_item.pcr_project = new_pcr_project
        new_item.save()
        return new_item


class PCRActivity(models.Model):
    pcr = models.ForeignKey("PCR", on_delete=models.PROTECT, related_name="activities")
    agency = models.ForeignKey(Agency, on_delete=models.PROTECT)
    type_of_activity = models.TextField(
        blank=True, null=True, help_text="Type of activity"
    )
    activity_title = models.TextField(
        blank=True, null=True, help_text="Type of activity"
    )
    type_of_sector = models.TextField(blank=True, null=True, help_text="Type of sector")
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

    def make_copy(self, new_pcr):
        new_item = self.__class__.objects.get(pk=self.pk)
        new_item.pk = None
        new_item.pcr = new_pcr
        new_item.agency = self.agency
        new_item.save()
        return new_item


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


class PCRProjectComponent(models.Model):
    pcr = models.ForeignKey(
        PCR, on_delete=models.PROTECT, related_name="project_components"
    )
    agency = models.ForeignKey(
        Agency, on_delete=models.PROTECT, related_name="project_components"
    )
    project_component_option = models.ForeignKey(
        PCRProjectComponentOption, on_delete=models.PROTECT
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "PCR project components"

    def __str__(self):
        return f"{self.pcr.meta_project.umbrella_code} - {self.project_component_option.name}"

    def make_copy(self, new_pcr):
        new_item = self.__class__.objects.get(pk=self.pk)
        new_item.pk = None
        new_item.pcr = new_pcr
        new_item.agency = self.agency
        new_item.save()
        return new_item


class PCRDelayCause(models.Model):
    pcr_project_component = models.ForeignKey(
        PCRProjectComponent, on_delete=models.PROTECT, related_name="delay_causes"
    )
    delay = models.ForeignKey("PCRDelayCategory", on_delete=models.PROTECT)
    description = models.TextField(blank=True, null=True, help_text="Planned output(s)")
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.pcr_project_component.pcr.meta_project.umbrella_code} - {self.delay}"

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

    pcr = models.ForeignKey(
        PCR, on_delete=models.PROTECT, related_name="gender_mainstreamings"
    )
    agency = models.ForeignKey(
        Agency, on_delete=models.PROTECT, related_name="gender_mainstreamings"
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

    def make_copy(self, new_pcr):
        new_item = self.__class__.objects.get(pk=self.pk)
        new_item.pk = None
        new_item.pcr = new_pcr
        new_item.agency = self.agency
        new_item.save()
        return new_item


class PCRGoal(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.FloatField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "PCR goals"

    def __str__(self):
        return self.name


class PCRSustainableDevelopmentGoal(models.Model):
    pcr = models.ForeignKey(
        PCR, on_delete=models.PROTECT, related_name="sustainable_development_goals"
    )
    agency = models.ForeignKey(
        Agency, on_delete=models.PROTECT, related_name="sustainable_development_goals"
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
        return f"{self.pcr.meta_project.umbrella_code} - {self.agency.name}"

    def make_copy(self, new_pcr: "PCR"):
        new_item = self.__class__.objects.get(pk=self.pk)
        new_item.pk = None
        new_item.pcr = new_pcr
        new_item.agency = self.agency

        descriptions = PCRSustainableDevelopmentGoalDescription.objects.filter(sgr=self)

        for desc in descriptions:
            desc.make_copy(new_item)

        new_item.save()
        return new_item


class PCRSustainableDevelopmentGoalDescription(models.Model):
    goal = models.ForeignKey(PCRGoal, on_delete=models.PROTECT)
    sgr = models.ForeignKey(PCRSustainableDevelopmentGoal, on_delete=models.PROTECT)
    description = models.TextField(null=True, blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    def make_copy(self, sgr: "PCRSustainableDevelopmentGoal"):
        new_item = self.__class__.objects.get(pk=self.pk)
        new_item.pk = None
        new_item.goal = self.goal
        new_item.sgr = sgr
        new_item.save()
        return new_item


class PCRSupportingEvidenceSection(models.Model):
    code = models.CharField(max_length=10, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.FloatField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "PCR supporting evidence sections"

    def __str__(self):
        return self.name


class PCRSupportingEvidence(models.Model):
    pcr = models.ForeignKey(
        PCR, on_delete=models.PROTECT, related_name="supporting_evidences"
    )
    agency = models.ForeignKey(
        Agency, on_delete=models.PROTECT, related_name="supporting_evidences"
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

    def make_copy(self, new_pcr):
        new_item = self.__class__.objects.get(pk=self.pk)
        new_item.pk = None
        new_item.pcr = new_pcr
        new_item.agency = self.agency
        new_item.section = self.section

        original_file_path = self.file.path
        new_file_path = _get_new_file_path(self.file.name, new_item.id)
        storage = get_protected_storage()
        with storage.open(original_file_path, "rb") as original_file:
            with storage.open(new_file_path, "wb") as new_file:
                shutil.copyfileobj(original_file, new_file)
        new_item.file.name = new_file_path

        new_item.save()
        return new_item


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
