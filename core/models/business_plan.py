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
    class HCFCStatus(models.TextChoices):
        lvc = "LVC", "LVC"
        non_lvc = "Non-LVC", "Non-LVC"
        regional = "Regional", "Regional"
        undefined = "Undefined", "Undefined"

    class BPType(models.TextChoices):
        approved = "A", "Approved"
        planned = "P", "Planned"
        undefined = "U", "Undefined"

    title = models.CharField(max_length=255)
    cluster = models.CharField(max_length=255, null=True, blank=True)
    year_start = models.IntegerField(
        validators=[MinValueValidator(settings.MIN_VALID_YEAR)]
    )
    year_end = models.IntegerField(
        validators=[MinValueValidator(settings.MIN_VALID_YEAR)]
    )
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    hcfc_status = models.CharField(max_length=32, choices=HCFCStatus.choices)
    project_type = models.ForeignKey(ProjectType, on_delete=models.CASCADE)
    bp_chemical_type = models.ForeignKey(BPChemicalType, on_delete=models.CASCADE)
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
    reason_for_exceding = models.TextField(null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    remarks_additional = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.title


class BPValue(models.Model):
    business_plan = models.ForeignKey(BusinessPlan, on_delete=models.CASCADE)
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
