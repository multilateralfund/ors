from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from core.models.agency import Agency
from core.models.country import Country
from core.models.project import (
    ProjectCluster,
    ProjectSector,
    ProjectSubSector,
    ProjectType,
)
from core.models.substance import Substance
from core.models.utils import get_protected_storage


class BPChemicalType(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class BusinessPlan(models.Model):
    class Status(models.TextChoices):
        agency_draft = "Agency Draft", "Agency Draft"  # update => not saving versions
        secretariat_draft = (
            "Secretariat Draft",
            "Secretariat Draft",
        )  # update => not versions
        submitted = "Submitted", "Submitted"  # can't update
        need_changes = "Need Changes", "Need Changes"  # update => saving versions
        approved = "Approved", "Approved"  # can't update
        rejected = "Rejected", "Rejected"  # can't update

    def upload_path(self, filename):
        return f"bp_files/{self.agency}/{self.year_start}-{self.year_end}/{filename}"

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
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.agency_draft
    )
    version = models.IntegerField(default=1)

    # feedback file
    feedback_filename = models.CharField(max_length=100, blank=True)
    feedback_file = models.FileField(
        storage=get_protected_storage, upload_to=upload_path, blank=True
    )

    def __str__(self):
        return f"{self.agency_id} {self.year_start}-{self.year_end}"


class BPRecord(models.Model):
    class LVCStatus(models.TextChoices):
        lvc = "LVC", "LVC"
        non_lvc = "Non-LVC", "Non-LVC"
        regional = "Regional", "Regional"
        undefined = "Undefined", "Undefined"

    class Status(models.TextChoices):
        approved = "A", "Approved"
        planned = "P", "Planned"
        rejected = "R", "Rejected"
        undefined = "U", "Undefined"

    business_plan = models.ForeignKey(
        BusinessPlan, on_delete=models.CASCADE, related_name="records"
    )
    title = models.CharField(max_length=255)
    required_by_model = models.CharField(max_length=255, null=True, blank=True)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    lvc_status = models.CharField(max_length=32, choices=LVCStatus.choices)
    project_cluster = models.ForeignKey(
        ProjectCluster, on_delete=models.CASCADE, null=True, blank=True
    )
    project_type = models.ForeignKey(ProjectType, on_delete=models.CASCADE)
    legacy_project_type = models.CharField(max_length=255, null=True, blank=True)
    bp_chemical_type = models.ForeignKey(
        BPChemicalType, on_delete=models.CASCADE
    )  # cluster
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
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.undefined
    )
    is_multi_year = models.BooleanField(default=False)
    reason_for_exceeding = models.TextField(null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    remarks_additional = models.TextField(null=True, blank=True)

    # Secretariat comment
    comment_secretariat = models.TextField(blank=True)

    def __str__(self):
        return self.title


class BPRecordValue(models.Model):
    bp_record = models.ForeignKey(
        BPRecord, on_delete=models.CASCADE, related_name="values"
    )
    year = models.IntegerField(validators=[MinValueValidator(settings.MIN_VALID_YEAR)])
    value_usd = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )
    value_odp = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )
    value_mt = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )


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
    bp_version = models.FloatField(default=1)

    class Meta:
        ordering = ["-created_at"]
