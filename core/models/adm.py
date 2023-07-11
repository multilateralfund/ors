from django.core.validators import MinValueValidator
from django.db import models
from mptt.models import MPTTModel, TreeForeignKey

from core.models.blend import Blend
from core.models.country_programme import CPReport
from core.models.substance import Substance


class AdmColumn(models.Model):
    class AdmColumnType(models.TextChoices):
        TEXT = "text", "Text"
        NUMBER = "float", "Float"
        DATE = "date", "Date"
        BOOLEAN = "boolean", "Boolean"
        CHOICE = "choice", "Choice"

    class AdmColumnSection(models.TextChoices):
        B = "B", "B"
        C = "C", "C"

    name = models.CharField(max_length=248)
    display_name = models.CharField(max_length=248)
    type = models.CharField(max_length=248, choices=AdmColumnType.choices)
    section = models.CharField(max_length=10, choices=AdmColumnSection.choices)
    min_year = models.PositiveIntegerField(validators=[MinValueValidator(1985)])
    max_year = models.PositiveIntegerField(validators=[MinValueValidator(1985)])
    sort_order = models.FloatField(null=True, blank=True)
    source_file = models.CharField(max_length=248, null=True, blank=True)

    class Meta:
        db_table = "cp_admcolumn"

    def __str__(self):
        return f"{self.display_name} - {self.type}"


class AdmRow(MPTTModel):
    class AdmRowType(models.TextChoices):
        TITLE = "title", "Title"
        SUBTITLE = "subtitle", "Subtitle"
        QUESTION = "question", "Question"
        USER_TEXT = "user_text", "User Text"

    class AdmRowSection(models.TextChoices):
        B = "B", "B"
        C = "C", "C"
        D = "D", "D"

    text = models.TextField()
    type = models.CharField(max_length=10, choices=AdmRowType.choices)
    section = models.CharField(max_length=10, choices=AdmRowSection.choices)
    min_year = models.PositiveIntegerField(validators=[MinValueValidator(1985)])
    max_year = models.PositiveIntegerField(validators=[MinValueValidator(1985)])
    index = models.CharField(
        max_length=248, null=True, blank=True, verbose_name="row index"
    )
    parent = TreeForeignKey(
        to="self",
        related_name="children",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
    )
    sort_order = models.IntegerField(null=True, blank=True)
    source_file = models.CharField(max_length=248, null=True, blank=True)

    country_programme_report = models.ForeignKey(
        CPReport,
        on_delete=models.CASCADE,
        related_name="adm_rows",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "cp_admrow"

    def __str__(self):
        if self.index:
            return f"{self.index} {self.text}"
        return self.text


class AdmChoice(models.Model):
    value = models.CharField(max_length=248)
    adm_row = models.ForeignKey(
        AdmRow, on_delete=models.CASCADE, related_name="choices"
    )
    sort_order = models.FloatField(null=True, blank=True)
    source_file = models.CharField(max_length=248, null=True, blank=True)

    class Meta:
        db_table = "cp_admchoice"

    def __str__(self):
        return self.value


class AdmRecord(models.Model):
    country_programme_report = models.ForeignKey(
        CPReport,
        on_delete=models.CASCADE,
        related_name="adm_records",
    )
    row = models.ForeignKey(AdmRow, on_delete=models.CASCADE)
    column = models.ForeignKey(
        AdmColumn, on_delete=models.CASCADE, null=True, blank=True
    )

    substance = models.ForeignKey(
        Substance, on_delete=models.CASCADE, null=True, blank=True
    )
    blend = models.ForeignKey(Blend, on_delete=models.CASCADE, null=True, blank=True)

    value_text = models.TextField(null=True, blank=True)
    value_choice = models.ForeignKey(
        AdmChoice, on_delete=models.CASCADE, null=True, blank=True
    )
    section = models.CharField(max_length=10)
    source_file = models.CharField(max_length=248, null=True, blank=True)

    class Meta:
        db_table = "cp_admrecord"

    def __str__(self):
        if self.column:
            return self.row.text + " - " + self.column.name

        return self.row.text
