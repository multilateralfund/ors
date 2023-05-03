from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from core.models.substance import Substance


class BlendManager(models.Manager):
    def get_by_name(self, name):
        name_str = name.lower()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(other_names__iexact=name_str)
        )


class Blend(models.Model):
    class BlendTypes(models.TextChoices):
        ZEOTROPE = "Zeotrope", "Zeotrope"
        AZEOTROPE = "Azeotrope", "Azeotrope"
        MeBr = "Methyl bromide", "Methyl bromide"
        OTHER = "Other", "Other"
        CUSTOM = "Custom", "Custom"

    name = models.CharField(max_length=64, unique=True)
    composition = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Plain-test description of the composition of the blend.",
    )
    composition_alt = models.CharField(max_length=256, null=True, blank=True)
    other_names = models.CharField(max_length=256, null=True, blank=True)
    trade_name = models.CharField(max_length=256, null=True, blank=True)
    type = models.CharField(max_length=256, choices=BlendTypes.choices)
    odp = models.DecimalField(
        max_digits=20,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Ozone Depletion Potential",
    )
    gwp = models.DecimalField(
        max_digits=20,
        decimal_places=10,
        null=True,
        blank=True,
        help_text="Global Warming Potential",
    )
    is_contained_in_polyols = models.BooleanField(default=False)
    sort_order = models.IntegerField(null=True)

    objects = BlendManager()

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
