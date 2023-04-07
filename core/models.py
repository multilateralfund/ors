from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class User(AbstractUser):
    pass


# substance model
class Substance(models.Model):
    name = models.CharField(max_length=128)
    description = models.TextField(null=True, blank=True)
    odp = models.DecimalField(max_digits=20, decimal_places=10)
    min_odp = models.DecimalField(max_digits=20, decimal_places=10)
    max_odp = models.DecimalField(max_digits=20, decimal_places=10)
    gwp = models.DecimalField(max_digits=20, decimal_places=10, null=True, blank=True)
    formula = models.CharField(max_length=256, null=True, blank=True)
    number_of_isomers = models.SmallIntegerField(null=True, blank=True)
    gwp_error_plus_minus = models.DecimalField(
        max_digits=20, decimal_places=10, null=True, blank=True
    )
    gwp_baseline = models.DecimalField(
        max_digits=20, decimal_places=10, null=True, blank=True
    )
    carbons = models.CharField(max_length=128, null=True, blank=True)
    hydrogens = models.CharField(max_length=128, null=True, blank=True)
    fluorines = models.CharField(max_length=128, null=True, blank=True)
    chlorines = models.CharField(max_length=128, null=True, blank=True)
    bromines = models.CharField(max_length=128, null=True, blank=True)
    sort_order = models.IntegerField(null=True)
    is_contained_in_polyols = models.BooleanField()
    is_captured = models.BooleanField(default=False)
    group = models.ForeignKey(
        "Group",
        null=True,
        blank=True,
        related_name="substances",
        on_delete=models.SET_NULL,
    )

    def __str__(self):
        return self.name


class Group(models.Model):
    group_id = models.CharField(max_length=64)
    annex = models.CharField(max_length=64)
    name = models.CharField(max_length=128, unique=True, default="")
    name_alt = models.CharField(max_length=128, blank=True, null=True)
    description = models.TextField()
    description_alt = models.TextField(null=True, blank=True)
    is_odp = models.BooleanField(default=True)
    is_gwp = models.BooleanField(default=False)

    def __str__(self):
        return self.name


# blend model
class Blend(models.Model):
    class BlendTypes(models.TextChoices):
        ZEOTROPE = "Zeotrope", "Zeotrope"
        AZEOTROPE = "Azeotrope", "Azeotrope"
        MeBr = "Methyl bromide", "Methyl bromide"
        OTHER = "Other", "Other"
        CUSTOM = "Custom", "Custom"

    name = models.CharField(max_length=64, unique=True)
    composition = models.CharField(max_length=256, null=True, blank=True)
    composition_alt = models.CharField(max_length=256, null=True, blank=True)
    other_names = models.CharField(max_length=256, null=True, blank=True)
    trade_name = models.CharField(max_length=256, null=True, blank=True)
    type = models.CharField(max_length=256, choices=BlendTypes.choices)
    odp = models.DecimalField(max_digits=20, decimal_places=10, null=True, blank=True)
    gwp = models.DecimalField(max_digits=20, decimal_places=10, null=True, blank=True)
    is_contained_in_polyols = models.BooleanField(default=False)
    sort_order = models.IntegerField(null=True)

    def __str__(self):
        return self.name


class BlendComponents(models.Model):
    blend = models.ForeignKey(Blend, on_delete=models.CASCADE)
    substance = models.ForeignKey(Substance, on_delete=models.CASCADE)
    percentage = models.DecimalField(
        max_digits=6,
        decimal_places=5,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )
    component_name = models.CharField(max_length=128, blank=True)

    def __str__(self):
        return self.blend.blend_id + " " + self.substance.name + " " + self.percentage


# country model; contains name, m49 code, and iso code
class Country(models.Model):
    country_name = models.CharField(max_length=100)
    country_m49 = models.IntegerField(null=True, blank=True)
    country_iso = models.CharField(max_length=3, null=True, blank=True)

    def __str__(self):
        return self.country_name


class Usage(models.Model):
    usage_name = models.CharField(max_length=100)
    usage_description = models.TextField()
    usage_parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="parent"
    )

    def __str__(self):
        return self.usage_name
