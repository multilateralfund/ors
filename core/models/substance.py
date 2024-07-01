from django.db import models


class SubstanceManager(models.Manager):
    def find_by_name(self, name):
        """
        Get a substance by name (search in substance and substance_alt_name tables)

        @param name: substance name

        @return: Substance object or None
        """
        name_str = name.strip()
        substance = self.filter(models.Q(name__iexact=name_str)).first()

        if substance:
            return substance

        substance_alt_name = SubstanceAltName.objects.find_by_name(name)
        if substance_alt_name:
            return substance_alt_name.substance

        return None


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
    sort_order = models.FloatField(
        null=True, blank=True, help_text="General sort order"
    )
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
    cp_report_note = models.TextField(null=True, blank=True)

    objects = SubstanceManager()

    def __str__(self):
        return self.name


class SubstanceAltNameManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(name__iexact=name_str).first()


class SubstanceAltName(models.Model):
    substance = models.ForeignKey(
        "Substance", on_delete=models.CASCADE, related_name="alt_names"
    )
    name = models.CharField(max_length=128, unique=True)
    ozone_id = models.IntegerField(null=True, blank=True)

    objects = SubstanceAltNameManager()

    def __str__(self):
        return self.name
