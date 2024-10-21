from django.db import models

from core.models.country_programme import CPReport


class CountryManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str)
            | models.Q(full_name__iexact=name_str)
            | models.Q(name_alt__iexact=name_str)
        ).first()

    def with_has_cp_report(self):
        """
        Returns a queryset of countries with a boolean field has_cp_report
        """

        return self.annotate(
            has_cp_report=models.Exists(
                CPReport.objects.filter(country_id=models.OuterRef("pk"))
            )
        )

    def find_by_name_and_type(self, name, location_type):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str)
            | models.Q(full_name__iexact=name_str)
            | models.Q(name_alt__iexact=name_str),
            location_type=location_type,
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
    is_a2 = models.BooleanField(default=False)
    consumption_category = models.CharField(max_length=100, blank=True)
    consumption_group = models.CharField(max_length=100, blank=True)

    objects = CountryManager()

    def is_ceit_for_year(self, year):
        """
        Returns CEIT status of this Country for given year
        """
        for ceit_status in self.ceit_statuses.all():
            if year >= ceit_status.start_year and (
                ceit_status.end_year is None or year <= ceit_status.end_year
            ):
                return ceit_status.is_ceit

        return False

    class Meta:
        verbose_name_plural = "Countries"
        ordering = ("name",)

    def __str__(self):
        return self.name


class CountryCEITStatus(models.Model):
    country = models.ForeignKey(
        Country, related_name="ceit_statuses", on_delete=models.CASCADE
    )

    start_year = models.IntegerField()
    end_year = models.IntegerField(null=True, blank=True)

    is_ceit = models.BooleanField()
