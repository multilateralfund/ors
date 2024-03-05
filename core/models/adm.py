from django.db import models
from mptt.models import MPTTModel, TreeForeignKey, TreeManager

from core.models.base import AbstractWChemical, BaseWTimeFrameManager
from core.models.country_programme import CPReport
from core.models.country_programme_archive import CPReportArchive
from core.models.time_frame import TimeFrame


class AdmColumnManager(BaseWTimeFrameManager):
    def get_for_year(self, year):
        return (
            super()
            .get_for_year(year)
            .filter(parent=None)
            .order_by("section", "sort_order")
        )


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
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, related_name="children", null=True, blank=True
    )
    display_name = models.CharField(max_length=248)
    alt_display_name = models.CharField(max_length=248, null=True, blank=True)
    type = models.CharField(max_length=248, choices=AdmColumnType.choices)
    section = models.CharField(max_length=10, choices=AdmColumnSection.choices)
    time_frame = models.ForeignKey(TimeFrame, on_delete=models.CASCADE)
    sort_order = models.FloatField(null=True, blank=True)
    source_file = models.CharField(max_length=248, null=True, blank=True)

    objects = AdmColumnManager()

    class Meta:
        db_table = "cp_admcolumn"

    def __str__(self):
        return f"{self.name}"


class AdmRowManager(TreeManager):
    def get_for_year(self, year):
        return (
            self.select_related("time_frame")
            .filter(
                (models.Q(time_frame__min_year__lte=year)),
                (
                    models.Q(time_frame__max_year__gte=year)
                    | models.Q(time_frame__max_year__isnull=True)
                ),
            )
            # .get_descendants(include_self=True)
            .prefetch_related("choices")
            .order_by("sort_order", "level")
        )


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
    time_frame = models.ForeignKey(TimeFrame, on_delete=models.CASCADE)
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

    objects = AdmRowManager()

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
    with_text = models.BooleanField(default=False)
    text_label = models.CharField(max_length=248, null=True, blank=True)
    sort_order = models.FloatField(null=True, blank=True)
    source_file = models.CharField(max_length=248, null=True, blank=True)

    class Meta:
        db_table = "cp_admchoice"

    def __str__(self):
        return self.value


class BaseAdmRecord(AbstractWChemical):
    row = models.ForeignKey(AdmRow, on_delete=models.CASCADE)
    column = models.ForeignKey(
        AdmColumn, on_delete=models.CASCADE, null=True, blank=True
    )
    value_text = models.TextField(null=True, blank=True)
    value_choice = models.ForeignKey(
        AdmChoice, on_delete=models.CASCADE, null=True, blank=True
    )
    section = models.CharField(max_length=10)
    source_file = models.CharField(max_length=248, null=True, blank=True)

    class Meta:
        abstract = True

    def __str__(self):
        if self.column:
            return self.row.text + " - " + self.column.name

        return self.row.text


class AdmRecord(BaseAdmRecord):
    country_programme_report = models.ForeignKey(
        CPReport,
        on_delete=models.CASCADE,
        related_name="adm_records",
    )

    class Meta:
        db_table = "cp_admrecord"


class AdmRecordArchive(BaseAdmRecord):
    country_programme_report = models.ForeignKey(
        CPReportArchive,
        on_delete=models.CASCADE,
        related_name="adm_records",
    )

    class Meta:
        db_table = "cp_admrecord_archive"


class AdmEmptyImmutableCell(models.Model):
    row = models.ForeignKey(
        AdmRow, on_delete=models.CASCADE, related_name="immutable_cells"
    )
    column = models.ForeignKey(
        AdmColumn, on_delete=models.CASCADE, related_name="immutable_cells"
    )
    section = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.row} - {self.column}"
