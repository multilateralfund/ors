from django.db import models


class SubstanceManager(models.Manager):
    def get_by_name(self, name):
        name_str = name.strip()
        return self.filter(models.Q(name__iexact=name_str))


# substance model
class Substance(models.Model):
    name = models.CharField(max_length=128, unique=True)
    description = models.TextField(null=True, blank=True)
    odp = models.DecimalField(max_digits=20, decimal_places=10, null=True, blank=True)
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
    sort_order = models.FloatField(null=True, blank=True)
    is_contained_in_polyols = models.BooleanField()
    is_captured = models.BooleanField(default=False)
    ozone_id = models.IntegerField(null=True, blank=True)
    group = models.ForeignKey(
        "Group",
        null=True,
        blank=True,
        related_name="substances",
        on_delete=models.SET_NULL,
    )

    objects = SubstanceManager()

    def __str__(self):
        return self.name


class SubstanceAltName(models.Model):
    substance = models.ForeignKey(Substance, on_delete=models.CASCADE)
    name = models.CharField(max_length=128, unique=True)
    ozone_id = models.IntegerField(null=True, blank=True)

    objects = SubstanceManager()

    def __str__(self):
        return self.name
