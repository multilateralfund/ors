from django.db import models


class BaseWTimeFrameManager(models.Manager):
    def get_for_year(self, year):
        if not year:
            return self.all()
        return self.select_related("time_frame").filter(
            (models.Q(time_frame__min_year__lte=year)),
            (
                models.Q(time_frame__max_year__gte=year)
                | models.Q(time_frame__max_year__isnull=True)
            ),
        )
