from django.db import models

from core.models.blend import Blend
from core.models.country_programme import CountryProgrammeReport
from core.models.substance import Substance


class Price(models.Model):
    blend = models.ForeignKey(Blend, on_delete=models.CASCADE, null=True, blank=True)
    substance = models.ForeignKey(
        Substance, on_delete=models.CASCADE, null=True, blank=True
    )
    value = models.FloatField()
    comment = models.TextField(null=True, blank=True)
    country_programme_report = models.ForeignKey(
        CountryProgrammeReport, on_delete=models.CASCADE
    )
