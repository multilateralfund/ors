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


class AbstractWChemical(models.Model):
    substance = models.ForeignKey(
        "Substance",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    blend = models.ForeignKey(
        "Blend",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    def get_chemical_display_name(self):
        if self.blend:
            return self.blend.get_display_name()
        return self.substance.name

    def get_group_name(self):
        if self.blend:
            return "Blends (Mixture of Controlled Substances)"
        if self.substance:
            return self.substance.group.name_alt
        return None

    class Meta:
        abstract = True
