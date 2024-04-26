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
        # pylint: disable=E1101
        if self.blend:
            return self.blend.get_display_name()
        return self.substance.name

    def get_chemical_name(self):
        # pylint: disable=E1101
        return self.substance.name if self.substance else self.blend.name

    def get_group_name(self):
        # pylint: disable=E1101
        if self.blend:
            return "Blends (Mixture of Controlled Substances)"
        if self.substance:
            return self.substance.group.name_alt
        return None

    def get_chemical_note(self):
        # pylint: disable=E1101
        chemical = self.substance if self.substance else self.blend
        return chemical.cp_report_note

    def get_excluded_usages_list(self):
        chemical = self.substance if self.substance else self.blend
        return list({usage.usage_id for usage in chemical.excluded_usages.all()})

    def get_chemical_gwp(self):
        # pylint: disable=E1101
        chemical = self.substance if self.substance else self.blend
        return chemical.gwp if chemical.gwp else 0

    def get_chemical_odp(self):
        # pylint: disable=E1101
        chemical = self.substance if self.substance else self.blend
        return chemical.odp if chemical.odp else 0

    def mt_convert_to_odp(self, value):
        if value is None:
            return 0

        odp_value = self.get_chemical_odp()
        return value * odp_value

    def mt_convert_to_gwp(self, value):
        if value is None:
            return 0

        gwp_value = self.get_chemical_gwp()
        return value * gwp_value

    class Meta:
        abstract = True
