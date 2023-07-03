from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from core.models.substance import Substance


class BlendManager(models.Manager):
    def find_by_name(self, name):
        """
        Get a blend by name (search in blend and blend_alt_name tables)

        @param name: blend name

        @return: Blend object or None
        """
        name_str = name.strip()

        # try to find the blend by name
        blend = self.filter(
            models.Q(name__iexact=name_str)
            | models.Q(other_names__iexact=name_str)
            | models.Q(composition__iexact=name_str)
            | models.Q(composition_alt__iexact=name_str)
        ).first()

        if blend:
            return blend

        # try to find the blend by alternative name
        blend_alt_name = BlendAltName.objects.find_by_name(name)

        if blend_alt_name:
            return blend_alt_name.blend

        return None

    def find_by_components(self, components):
        """
        get a blend by components

        @param components: list of tuples (substance_name, percentage)

        @return: Blend object or None
        """
        subst_prcnt = []
        for substance_name, percentage in components:
            try:
                subst = Substance.objects.find_by_name(substance_name)
                if not subst:
                    return None
                prcnt = float(percentage) / 100
                subst_prcnt.append((subst, prcnt))
            except ValueError:
                # if the percentage is not a number return None
                return None

        blend = BlendComponents.objects.get_blend_by_components(subst_prcnt)
        return blend

    def find_by_name_or_components(self, name, components=[]):
        """
        Get a blend by name or components

        @param name: blend name
        @param components: list of tuples (substance_name, percentage)

        @return: Blend object or None
        """
        # find by name
        blend = self.find_by_name(name)
        if blend:
            return blend

        # find by components
        if components:
            return self.find_by_components(components)

        return None


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
    sort_order = models.FloatField(null=True, blank=True)
    ozone_id = models.IntegerField(null=True, blank=True)

    objects = BlendManager()

    def __str__(self):
        return self.name


class BlendAltNameManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(name__iexact=name_str).first()


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

        @param components_list: list of tuples (substance_id, percentage)
        @return: Blend object or None
        """
        filter_lsit = []
        # set the filter list for the query using the components list
        for substance_id, percentage in components_list:
            filter_lsit.append(
                models.Q(substance_id=substance_id, percentage=percentage)
            )

        # create the query
        filters = filter_lsit.pop()
        for item in filter_lsit:
            filters |= item

        queryset = (
            self.values("blend_id")
            .filter(filters)
            .annotate(total=models.Count("substance_id"))
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

    class Meta:
        verbose_name_plural = "Blend components"

    def __str__(self):
        return self.blend.name + " " + self.substance.name + " " + str(self.percentage)
