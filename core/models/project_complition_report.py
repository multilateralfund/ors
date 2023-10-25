from django.db import models
from core.models.agency import Agency

from core.models.project import MetaProject


class PCRSector(models.Model):
    class PCRSectorType(models.TextChoices):
        INVESTMENT = 1, "Investment"
        NONINVESTMENT = 2, "Non-investment"

    name = models.CharField(max_length=255, blank=True, null=True)
    sector_type = models.CharField(
        max_length=255, choices=PCRSectorType.choices, blank=True, null=True
    )

    def __str__(self):
        return self.name


class PCRActivity(models.Model):
    meta_project = models.ForeignKey(MetaProject, on_delete=models.CASCADE)
    sector = models.ForeignKey(PCRSector, on_delete=models.CASCADE)
    type_of_activity = models.TextField(blank=True, null=True)
    planned_output = models.TextField(blank=True, null=True)
    actual_activity_output = models.TextField(blank=True, null=True)
    evaluation = models.IntegerField(blank=True, null=True)
    explanation = models.TextField(blank=True, null=True)
    source_file = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name_plural = "PCR activities"


class DelayCategory(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.name


class PCRDelayExplanation(models.Model):
    meta_project = models.ForeignKey(MetaProject, on_delete=models.CASCADE)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    category = models.ForeignKey(DelayCategory, on_delete=models.CASCADE)
    delay_cause = models.TextField(blank=True, null=True)
    measures_to_overcome = models.TextField(blank=True, null=True)
    source_file = models.CharField(max_length=255, blank=True, null=True)


class LearnedLessonCategory(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.name


class PCRLearnedLessons(models.Model):
    meta_project = models.ForeignKey(MetaProject, on_delete=models.CASCADE)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    category = models.ForeignKey(LearnedLessonCategory, on_delete=models.CASCADE)
    description = models.TextField(blank=True, null=True)
    source_file = models.CharField(max_length=255, blank=True, null=True)
