from django.db import models


class CountryManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str)
            | models.Q(full_name__iexact=name_str)
            | models.Q(name_alt__iexact=name_str)
        ).first()


# country model; contains name, m49 code, and iso code
class Country(models.Model):
    class LocationType(models.TextChoices):
        COUNTRY = "Country", "Country"
        REGION = "Region", "Region"
        SUBREGION = "Subregion", "Subregion"

    name = models.CharField(max_length=100, unique=True)
    name_alt = models.CharField(max_length=256, null=True, blank=True)
    abbr = models.CharField(max_length=10, null=True, blank=True)
    abbr_alt = models.CharField(max_length=10, null=True, blank=True)
    full_name = models.CharField(max_length=256)
    iso3 = models.CharField(max_length=3, unique=True, null=True, blank=True)
    ozone_unit = models.TextField(null=True, blank=True)
    is_lvc = models.BooleanField(default=False)
    lvc_baseline = models.FloatField(null=True, blank=True)
    ozone_id = models.IntegerField(null=True, blank=True)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True)
    location_type = models.CharField(
        max_length=16, choices=LocationType.choices, default=LocationType.COUNTRY
    )
    import_id = models.IntegerField(null=True, blank=True)

    objects = CountryManager()

    class Meta:
        verbose_name_plural = "Countries"
        ordering = ("name",)

    def __str__(self):
        return self.name


class RegionManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(name__iexact=name_str).first()


class Region(models.Model):
    name = models.CharField(max_length=100, unique=True)
    abbr = models.CharField(max_length=10, null=True, blank=True)

    objects = RegionManager()

    def __str__(self):
        return self.name


class Subregion(models.Model):
    name = models.CharField(max_length=100, unique=True)
    abbr = models.CharField(max_length=10, null=True, blank=True)
    import_id = models.IntegerField(null=True, blank=True)
    region = models.ForeignKey(
        Region,
        on_delete=models.CASCADE,
    )

    objects = RegionManager()

    def __str__(self):
        return self.name
