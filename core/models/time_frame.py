from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class TimeFrameManager(models.Manager):
    def find_by_frame(self, min_year, max_year):
        return self.filter(
            models.Q(min_year=min_year) & models.Q(max_year=max_year)
        ).first()


class TimeFrame(models.Model):
    min_year = models.PositiveIntegerField(
        validators=[MinValueValidator(settings.MIN_VALID_YEAR)]
    )
    max_year = models.PositiveIntegerField(
        validators=[MinValueValidator(settings.MIN_VALID_YEAR)], null=True, blank=True
    )
    source_file = models.CharField(max_length=248, null=True, blank=True)

    objects = TimeFrameManager()

    def __str__(self):
        if self.max_year:
            return f"{self.min_year} - {self.max_year}"
        return f"{self.min_year} - present"
