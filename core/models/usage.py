from django.db import models


class UsageManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(full_name__iexact=name_str)
        ).first()


class Usage(models.Model):
    name = models.CharField(max_length=100)
    full_name = models.CharField(max_length=248)
    description = models.TextField(null=True, blank=True)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, related_name="children", null=True, blank=True
    )
    sort_order = models.FloatField(null=True, blank=True)
    displayed_in_latest_format = models.BooleanField(
        default=True, help_text="Controls current-year visibility."
    )

    objects = UsageManager()

    def __str__(self):
        return self.full_name


class ExcludedUsageManager(models.Manager):
    def get_for_year(self, year):
        if not year:
            return self.all()
        return self.filter(
            (models.Q(start_year__lte=year) | models.Q(start_year__isnull=True)),
            (models.Q(end_year__gte=year) | models.Q(end_year__isnull=True)),
        )


class ExcludedUsage(models.Model):
    usage = models.ForeignKey(Usage, on_delete=models.CASCADE)
    start_year = models.IntegerField(null=True, blank=True)
    end_year = models.IntegerField(null=True, blank=True)
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

    objects = ExcludedUsageManager()
