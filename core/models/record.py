from django.db import models

from core.models.blend import Blend
from core.models.country_programme import CountryProgrammeReport
from core.models.substance import Substance
from core.models.usage import Usage


class Record(models.Model):
    blend = models.ForeignKey(Blend, on_delete=models.CASCADE, null=True, blank=True)
    substance = models.ForeignKey(
        Substance, on_delete=models.CASCADE, null=True, blank=True
    )
    country_programme_report = models.ForeignKey(
        CountryProgrammeReport, on_delete=models.CASCADE
    )
    usage = models.ForeignKey(Usage, on_delete=models.CASCADE)
    value_odp = models.FloatField(null=True, blank=True)
    value_metric = models.FloatField(null=True, blank=True)
    section = models.CharField(max_length=164)
    source = models.CharField(max_length=248)
