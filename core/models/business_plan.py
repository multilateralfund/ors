from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from core.models.agency import Agency
from core.models.blend import Blend

from core.models.country import Country
from core.models.project import ProjectSector, ProjectSubSector, ProjectType
from core.models.substance import Substance


class BPChemicalType(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class BusinessPlan(models.Model):
    class Status(models.TextChoices):
        draft = "Draft", "Draft"  # update => not saving versions
        submitted = "Submitted", "Submitted"  # update => saving versions
        approved = "Approved", "Approved"  # can't update
        rejected = "Rejected", "Rejected"  # can't update ???

    year_start = models.IntegerField(
        validators=[MinValueValidator(settings.MIN_VALID_YEAR)]
    )
    year_end = models.IntegerField(
        validators=[MinValueValidator(settings.MIN_VALID_YEAR)]
    )
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.draft
    )

    def __str__(self):
        return f"{self.agency_id} {self.year_start}-{self.year_end}"


class BPRecord(models.Model):
    class LVCStatus(models.TextChoices):
        lvc = "LVC", "LVC"
        non_lvc = "Non-LVC", "Non-LVC"
        regional = "Regional", "Regional"
        undefined = "Undefined", "Undefined"

    class BPType(models.TextChoices):
        approved = "A", "Approved"
        planned = "P", "Planned"
        undefined = "U", "Undefined"

    business_plan = models.ForeignKey(
        BusinessPlan, on_delete=models.CASCADE, related_name="records"
    )
    title = models.CharField(max_length=255)
    required_by_model = models.CharField(max_length=255, null=True, blank=True)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    lvc_status = models.CharField(max_length=32, choices=LVCStatus.choices)
    project_type = models.ForeignKey(ProjectType, on_delete=models.CASCADE)
    bp_chemical_type = models.ForeignKey(
        BPChemicalType, on_delete=models.CASCADE
    )  # cluster
    substances = models.ManyToManyField(Substance)
    blends = models.ManyToManyField(Blend)
    amount_polyol = models.DecimalField(
        max_digits=25, decimal_places=15, null=True, blank=True
    )
    sector = models.ForeignKey(
        ProjectSector, on_delete=models.CASCADE, null=True, blank=True
    )
    subsector = models.ForeignKey(
        ProjectSubSector, on_delete=models.CASCADE, null=True, blank=True
    )
    sector_subsector = models.CharField(max_length=255, null=True, blank=True)
    bp_type = models.CharField(max_length=16, choices=BPType.choices)
    is_multi_year = models.BooleanField(default=False)
    reason_for_exceeding = models.TextField(null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    remarks_additional = models.TextField(null=True, blank=True)

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
