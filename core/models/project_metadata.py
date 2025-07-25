from colorfield.fields import ColorField

from django.conf import settings
from django.db import models

ALL_TYPE_CODES = ["CPG", "DEM", "INS", "INV", "PRP", "TAS", "TRA", "DOC", "PS", "PHA"]

# project type code - project sector code
PROJECT_SECTOR_TO_TYPE_MAPPINGS = {
    "ARS": ALL_TYPE_CODES,
    "DES": ALL_TYPE_CODES,
    "FOA": ALL_TYPE_CODES,
    "FUM": ALL_TYPE_CODES,
    "FFI": ALL_TYPE_CODES,
    "PAG": ALL_TYPE_CODES,
    "PRO": ALL_TYPE_CODES,
    "REF": ALL_TYPE_CODES,
    "SOL": ALL_TYPE_CODES,
    "STE": ALL_TYPE_CODES,
    "SRV": ALL_TYPE_CODES,
    "PMU": ["TAS"],
    "AC": ALL_TYPE_CODES,
    "EMS": ALL_TYPE_CODES,
    "ELM": ALL_TYPE_CODES,
    "CAP": ALL_TYPE_CODES,
    "CU": ALL_TYPE_CODES,
    "PCAP": ALL_TYPE_CODES,
    "NOU": ALL_TYPE_CODES,
    "CA": ALL_TYPE_CODES,
    # this one is only present in the KM consolidated data v2 file
    "TAS": ["TAS"],
}


class ProjectField(models.Model):
    import_name = models.CharField(max_length=255)
    label = models.CharField(max_length=255)
    read_field_name = models.CharField(max_length=255)
    write_field_name = models.CharField(max_length=255)
    table = models.CharField(max_length=255)
    data_type = models.CharField(max_length=255)
    section = models.CharField(max_length=255, blank=True)
    is_actual = models.BooleanField(
        default=False,
        help_text="If True, the field is used for actual data, otherwise for planned data",
    )
    sort_order = models.IntegerField(
        default=0,
        help_text="Sort order of the field in the project form",
    )
    editable_in_versions = models.CharField(
        max_length=255,
        blank=True,
        help_text="Comma-separated list of project versions where the field is editable. Values: 1,2,3",
    )
    visible_in_versions = models.CharField(
        max_length=255,
        blank=True,
        help_text="Comma-separated list of project versions where the field is visible. Values: 1,2,3",
    )

    def __str__(self):
        return f"{self.table} - {self.label}"

    def get_editable_versions(self):
        return (
            [int(v) for v in self.editable_in_versions.split(",") if v.strip()]
            if self.editable_in_versions
            else []
        )

    def get_visible_versions(self):
        return (
            [int(v) for v in self.visible_in_versions.split(",") if v.strip()]
            if self.visible_in_versions
            else []
        )


class ProjectSpecificFields(models.Model):
    """
    Model that for a combination of cluster, type and sector
    gives a list of fields that are available for the project
    """

    cluster = models.ForeignKey(
        "ProjectCluster",
        on_delete=models.CASCADE,
        related_name="project_specific_fields",
    )
    type = models.ForeignKey(
        "ProjectType",
        on_delete=models.CASCADE,
        related_name="project_specific_fields",
    )
    sector = models.ForeignKey(
        "ProjectSector",
        on_delete=models.CASCADE,
        related_name="project_specific_fields",
    )
    fields = models.ManyToManyField(
        ProjectField,
        blank=True,
        related_name="project_specific_fields",
        help_text="List of fields that should be filled in the project for this"
        " combination of cluster, type and sector",
    )

    class Meta:
        verbose_name_plural = "Project specific fields"
        unique_together = (
            "cluster",
            "type",
            "sector",
        )


class ProjectClusterManager(models.Manager):
    def find_by_name_or_code(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str)
        ).first()


class ProjectCluster(models.Model):
    class ProjectClusterCategory(models.TextChoices):
        MYA = "MYA", "Multi-year agreement"
        IND = "IND", "Individual"
        BOTH = "BOTH", "Both"

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    category = models.CharField(
        max_length=255,
        choices=ProjectClusterCategory.choices,
        default=ProjectClusterCategory.BOTH,
    )
    group = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="""
            Dashboard group. If value is Production, projects with this cluster will be considered
            as production projects
        """,
    )
    production = models.BooleanField(
        default=False,
        null=True,
        help_text="""
            If True, projects with this cluster will be considered as production projects.
            If Null, the cluster allows both values.
        """,
    )
    sort_order = models.FloatField(null=True, blank=True)
    obsolete = models.BooleanField(
        default=False,
        help_text="If True, the cluster is obsolete and should not be used for new entries.",
    )

    objects = ProjectClusterManager()

    def __str__(self):
        return self.name


class ProjectTypeManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str)
        ).first()


class ProjectType(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    sort_order = models.FloatField(null=True, blank=True)
    obsolete = models.BooleanField(
        default=False,
        help_text="If True, the type is obsolete and should not be used for new entries.",
    )
    objects = ProjectTypeManager()

    def __str__(self):
        return self.name

    @property
    def allowed_sectors(self):
        sector_codes = [
            sector
            for sector, types in PROJECT_SECTOR_TO_TYPE_MAPPINGS.items()
            if self.code in types
        ]
        return list(
            ProjectSector.objects.filter(code__in=sector_codes).values_list(
                "id", flat=True
            )
        )


class ProjectSectorManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str)
        ).first()


class ProjectSector(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    sort_order = models.FloatField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        related_name="created_sectors",
        help_text="User who created the sector",
    )
    is_custom = models.BooleanField(
        default=False,
        help_text="Custom sector created by user, not from the official list.",
    )
    obsolete = models.BooleanField(
        default=False,
        help_text="If True, the sector is obsolete and should not be used for new entries.",
    )

    objects = ProjectSectorManager()

    def __str__(self):
        return self.name

    @property
    def allowed_types(self):
        type_codes = PROJECT_SECTOR_TO_TYPE_MAPPINGS.get(self.code, [])
        return list(
            ProjectType.objects.filter(code__in=type_codes).values_list("id", flat=True)
        )


class ProjectSubSectorManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str)
        ).first()

    def get_all_by_name_or_code(self, search_str):
        return self.filter(
            models.Q(name__icontains=search_str) | models.Q(code__icontains=search_str)
        ).all()

    def find_by_name_and_sector(self, name, sector_id):
        name = name or ""
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str),
            sector_id=sector_id,
        ).first()


class ProjectSubSector(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    sector = models.ForeignKey(ProjectSector, on_delete=models.CASCADE)
    sort_order = models.FloatField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        related_name="created_subsectors",
        help_text="User who created the subsector",
    )
    is_custom = models.BooleanField(
        default=False,
        help_text="Custom sector created by user, not from the official list.",
    )

    objects = ProjectSubSectorManager()

    def __str__(self):
        return self.name


class ProjectSubmissionStatusManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str)
        ).first()


class ProjectSubmissionStatus(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    color = ColorField(default="#CCCCCC")

    objects = ProjectSubmissionStatusManager()

    class Meta:
        verbose_name_plural = "Project submission statuses"

    def __str__(self):
        return self.name


class ProjectStatusManager(models.Manager):
    def find_by_name(self, name):
        name_str = name.strip()
        return self.filter(
            models.Q(name__iexact=name_str) | models.Q(code__iexact=name_str)
        ).first()


class ProjectStatus(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, null=True, blank=True)
    color = ColorField(default="#CCCCCC")

    objects = ProjectStatusManager()

    class Meta:
        verbose_name_plural = "Project statuses"

    def __str__(self):
        return self.name
