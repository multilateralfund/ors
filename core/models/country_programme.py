from django.db import models

from core.models.country import Country


class CountryProgrammeReport(models.Model):
    name = models.CharField(max_length=248)
    year = models.IntegerField()
    comment = models.TextField(null=True, blank=True)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
