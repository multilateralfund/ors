from django.db import models
from core.models.blend import Blend

from core.models.country_programme import CountryProgrammeReport
from core.models.substance import Substance


class AdmColumn(models.Model):
    name = models.CharField(max_length=248)
    sort_order = models.IntegerField(null=True, blank=True)
    source_file = models.CharField(max_length=248, null=True, blank=True)

    def __str__(self):
        return self.name


class AdmRow(models.Model):
    class AdmRowType(models.TextChoices):
        TITLE = "title", "Title"
        SUBTITLE = "subtitle", "Subtitle"
        QUESTION = "question", "Question"
        USER_TEXT = "user_text", "User Text"

    text = models.TextField()
    type = models.CharField(max_length=10, choices=AdmRowType.choices)
    index = models.CharField(
        max_length=248, null=True, blank=True, verbose_name="row index"
    )
    parent_row = models.ForeignKey(
        "self", on_delete=models.CASCADE, related_name="children", null=True, blank=True
    )
    sort_order = models.IntegerField(null=True, blank=True)
    source_file = models.CharField(max_length=248, null=True, blank=True)

    def __str__(self):
        return f"{self.index} {self.text}"


class AdmChoice(models.Model):
    value = models.CharField(max_length=248)
    sort_order = models.FloatField(null=True, blank=True)
    source_file = models.CharField(max_length=248, null=True, blank=True)


class AdmRecord(models.Model):
    country_programme_report = models.ForeignKey(
        CountryProgrammeReport,
        on_delete=models.CASCADE,
        related_name="adm_records",
    )
    row = models.ForeignKey(AdmRow, on_delete=models.CASCADE)
    column = models.ForeignKey(AdmColumn, on_delete=models.CASCADE)

    substance = models.ForeignKey(
        Substance, on_delete=models.CASCADE, null=True, blank=True
    )
    blend = models.ForeignKey(Blend, on_delete=models.CASCADE, null=True, blank=True)

    value_float = models.FloatField(null=True, blank=True)
    value_text = models.TextField(null=True, blank=True)
    value_bool = models.BooleanField(null=True, blank=True)
    value_date = models.DateField(null=True, blank=True)
    value_choice = models.ForeignKey(
        AdmChoice, on_delete=models.CASCADE, null=True, blank=True
    )
    section = models.CharField(max_length=10)
    source_file = models.CharField(max_length=248, null=True, blank=True)

    def __str__(self):
        return self.row.name + " - " + self.column.name
