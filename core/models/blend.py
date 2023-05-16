from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from core.models.substance import Substance


class BlendManager(models.Manager):
    def get_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str)
            | models.Q(other_names__iexact=name_str)
            | models.Q(composition__iexact=name_str)
            | models.Q(composition_alt__iexact=name_str)
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
    ozone_id = models.IntegerField(null=True, blank=True)

    objects = BlendManager()

    def __str__(self):
        return self.name


class BlendAltNameManager(models.Manager):
    def get_by_name(self, name):
        name_str = name.strip()
        return self.filter(name__iexact=name_str)


class BlendAltName(models.Model):
    name = models.CharField(max_length=256)
    blend = models.ForeignKey(Blend, on_delete=models.CASCADE)
    ozone_id = models.IntegerField(null=True, blank=True)

    objects = BlendAltNameManager()

    def __str__(self):
        return self.name


class BlendComponentManager(models.Manager):
    def get_blend_by_components(self, components_list):
        """
        get a blend by a list of components

        @param components_list: list of tuples (substance_name, percentage)
        @return: Blend object or None
        """
        filter_lsit = []
        # set the filter list for the query using the components list
        for substance_name, percentage in components_list:
            # check if the percentage is a float and if not return None
            try:
                percent = float(percentage) / 100
            except:
                return None

            filter_lsit.append(
                models.Q(substance__name__iexact=substance_name, percentage=percent)
            )

        # create the query
        filters = filter_lsit.pop()
        for item in filter_lsit:
            filters |= item

        queryset = (
            self.values("blend_id")
            .filter(filters)
            .annotate(total=models.Count("blend"))
            .filter(models.Q(total=len(components_list)))
        )

        # if the queryset is not empty return the blend
        if queryset:
            return Blend.objects.get(id=queryset[0]["blend_id"])

        return None


class BlendComponents(models.Model):
    blend = models.ForeignKey(Blend, on_delete=models.CASCADE)
    substance = models.ForeignKey(Substance, on_delete=models.CASCADE)
    percentage = models.DecimalField(
        max_digits=6,
        decimal_places=5,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )
    component_name = models.CharField(max_length=128, blank=True)
    ozone_id = models.IntegerField(null=True, blank=True)

    objects = BlendComponentManager()

    def __str__(self):
        return self.blend.blend_id + " " + self.substance.name + " " + self.percentage

    class Meta:
        verbose_name_plural = "Blend Components"
