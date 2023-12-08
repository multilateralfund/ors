from django.db import models
from core.models.base import BaseWTimeFrameManager

from core.models.time_frame import TimeFrame


class UsageManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(full_name__iexact=name_str)
        ).first()

    def find_by_full_name(self, name):
        name_str = name.strip()
        return self.filter(full_name__iexact=name_str).first()


class Usage(models.Model):
    name = models.CharField(max_length=100)
    full_name = models.CharField(max_length=248)
    description = models.TextField(null=True, blank=True)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True)
    sort_order = models.FloatField(null=True, blank=True)
    objects = UsageManager()

    def __str__(self):
        return self.full_name


class ExcludedUsage(models.Model):
    usage = models.ForeignKey(Usage, on_delete=models.CASCADE)
    time_frame = models.ForeignKey(TimeFrame, on_delete=models.CASCADE)
    substance = models.ForeignKey(
        "Substance",
        on_delete=models.CASCADE,
        related_name="excluded_usages",
        null=True,
        blank=True,
    )
    blend = models.ForeignKey(
        "Blend",
        on_delete=models.CASCADE,
        related_name="excluded_usages",
        null=True,
        blank=True,
    )

    objects = BaseWTimeFrameManager()
