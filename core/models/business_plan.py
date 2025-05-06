from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from core.models.agency import Agency
from core.models.country import Country
from core.models.meeting import Decision, Meeting
from core.models.project import (
    ProjectCluster,
    ProjectSector,
    ProjectSubSector,
)
from core.models.project_metadata import ProjectType
from core.models.substance import Substance
from core.models.utils import get_protected_storage


class BPChemicalType(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class BusinessPlan(models.Model):
    class Status(models.TextChoices):
        submitted = "Submitted", "Submitted"
        endorsed = "Endorsed", "Endorsed"

    def upload_path(self, filename):
        return f"bp_files//{self.year_start}-{self.year_end}/{self.status}/{filename}"

    created_at = models.DateTimeField(
        auto_now_add=True, null=True, help_text="Date of creation of the business plan"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        related_name="created_business_plans",
        help_text="User who created the business plan",
    )
    updated_at = models.DateTimeField(
        auto_now=True, null=True, help_text="Date of business plan last update"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        related_name="updated_business_plans",
        help_text="User who last updated the business plan",
    )

    name = models.CharField(max_length=100, blank=True)
    year_start = models.IntegerField(
        validators=[MinValueValidator(settings.MIN_VALID_YEAR)]
    )
    year_end = models.IntegerField(
        validators=[MinValueValidator(settings.MIN_VALID_YEAR)]
    )
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.endorsed
    )
    meeting = models.ForeignKey(
        Meeting, on_delete=models.PROTECT, null=True, blank=True
    )
    decision = models.ForeignKey(
        Decision, on_delete=models.PROTECT, null=True, blank=True
    )

    def __str__(self):
        return f"{self.status} {self.year_start}-{self.year_end}"


class BPActivityManager(models.Manager):
    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .select_related(
                "business_plan",
                "agency",
                "country",
                "sector",
                "subsector",
                "project_type",
                "bp_chemical_type",
                "project_cluster",
            )
            .prefetch_related(
                "substances",
                "values",
            )
        )


class BPActivity(models.Model):
    class LVCStatus(models.TextChoices):
        lvc = "LVC", "LVC"
        non_lvc = "Non-LVC", "Non-LVC"
        regional = "Regional", "Regional"
        status_global = "Global", "Global"
        ndr = "NDR", "NDR"
        undefined = "Undefined", "Undefined"

    class Status(models.TextChoices):
        approved = "A", "Approved"
        planned = "P", "Planned"
        rejected = "R", "Rejected"
        undefined = "U", "Undefined"

    business_plan = models.ForeignKey(
        BusinessPlan, on_delete=models.CASCADE, related_name="activities"
    )
    title = models.CharField(max_length=255, blank=True)
    required_by_model = models.CharField(max_length=255, null=True, blank=True)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE, null=True, blank=True)
    lvc_status = models.CharField(max_length=32, choices=LVCStatus.choices, blank=True)
    project_cluster = models.ForeignKey(
        ProjectCluster, on_delete=models.CASCADE, null=True, blank=True
    )
    project_type = models.ForeignKey(
        ProjectType, on_delete=models.CASCADE, null=True, blank=True
    )
    legacy_project_type = models.CharField(max_length=255, null=True, blank=True)
    bp_chemical_type = models.ForeignKey(
        BPChemicalType, on_delete=models.CASCADE, null=True, blank=True
    )
    substances = models.ManyToManyField(Substance)
    amount_polyol = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )
    sector = models.ForeignKey(
        ProjectSector, on_delete=models.CASCADE, null=True, blank=True
    )
    subsector = models.ForeignKey(
        ProjectSubSector, on_delete=models.CASCADE, null=True, blank=True
    )
    legacy_sector_and_subsector = models.CharField(
        max_length=255, null=True, blank=True
    )
    status = models.CharField(max_length=16, choices=Status.choices, blank=True)
    is_multi_year = models.BooleanField(default=False)
    reason_for_exceeding = models.TextField(null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    remarks_additional = models.TextField(null=True, blank=True)

    # Secretariat comment
    comment_secretariat = models.TextField(blank=True)

    initial_id = models.PositiveIntegerField(null=True, blank=True)

    objects = BPActivityManager()

    def __str__(self):
        return self.title

    class Meta:
        verbose_name_plural = "Bp activities"


class BPActivityValue(models.Model):
    bp_activity = models.ForeignKey(
        BPActivity, on_delete=models.CASCADE, related_name="values"
    )
    year = models.IntegerField(validators=[MinValueValidator(settings.MIN_VALID_YEAR)])
    is_after = models.BooleanField(default=False)
    value_usd = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )
    value_odp = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )
    value_mt = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )
    value_co2 = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["bp_activity", "year", "is_after"],
                name="unique_activity_year_is_after",
            )
        ]


class BPHistory(models.Model):
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Date of creation of the event"
    )
    business_plan = models.ForeignKey(
        BusinessPlan, on_delete=models.CASCADE, related_name="bphistory"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="updated_bp",
        help_text="User who updated the business plan",
    )
    event_description = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]


class BPFile(models.Model):
    def upload_path(self, filename):
        return f"bp_files/{self.status}/{self.year_start}-{self.year_end}/{filename}"

    uploaded_at = models.DateTimeField(
        auto_now_add=True, help_text="Date of file upload"
    )
    status = models.CharField(
        max_length=32,
        choices=BusinessPlan.Status.choices,
        default=BusinessPlan.Status.endorsed,
    )
    year_start = models.IntegerField(
        validators=[MinValueValidator(settings.MIN_VALID_YEAR)]
    )
    year_end = models.IntegerField(
        validators=[MinValueValidator(settings.MIN_VALID_YEAR)]
    )
    filename = models.CharField(max_length=100)
    file = models.FileField(storage=get_protected_storage, upload_to=upload_path)

    class Meta:
        ordering = ["-uploaded_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["status", "year_start", "year_end", "filename"],
                name="unique_business_plan_filename",
            )
        ]
