import core.models.project_metadata
from django.db import migrations, models
from django.db.models import Count, Exists, OuterRef


GENERIC_SUBSTANCE_FIELD_NAMES = [
    "ods_display_name",
    "ods_replacement_text",
    "odp",
    "phase_out_mt",
    "co2_mt",
    "products_manufactured",
]


def create_obsolete_project_specific_fields(apps, _schema_editor):
    Project = apps.get_model("core", "Project")
    ProjectField = apps.get_model("core", "ProjectField")
    ProjectSpecificFields = apps.get_model("core", "ProjectSpecificFields")

    generic_fields = list(
        ProjectField.objects.filter(
            write_field_name__in=GENERIC_SUBSTANCE_FIELD_NAMES,
        )
    )

    missing_combinations = (
        Project.objects.filter(
            latest_project__isnull=True,
            submission_status__name="Approved",
            ods_odp__isnull=False,
        )
        .exclude(cluster__isnull=True)
        .exclude(project_type__isnull=True)
        .exclude(sector__isnull=True)
        .annotate(
            has_project_specific_fields=Exists(
                ProjectSpecificFields.objects.with_obsolete().filter(
                    cluster_id=OuterRef("cluster_id"),
                    type_id=OuterRef("project_type_id"),
                    sector_id=OuterRef("sector_id"),
                )
            )
        )
        .filter(has_project_specific_fields=False)
        .values("cluster_id", "project_type_id", "sector_id")
        .annotate(project_count=Count("id", distinct=True))
    )

    for combination in missing_combinations:
        (
            project_specific_fields,
            _created,
        ) = ProjectSpecificFields.objects.with_obsolete().get_or_create(
            cluster_id=combination["cluster_id"],
            type_id=combination["project_type_id"],
            sector_id=combination["sector_id"],
            defaults={"obsolete": True},
        )
        if not project_specific_fields.obsolete:
            project_specific_fields.obsolete = True
            project_specific_fields.save(update_fields=["obsolete"])
        project_specific_fields.fields.set(generic_fields)


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0304_alter_decision_options_alter_meeting_options"),
    ]

    operations = [
        migrations.AddField(
            model_name="projectspecificfields",
            name="obsolete",
            field=models.BooleanField(
                default=False,
                help_text=(
                    "If True, this mapping is only used for rendering legacy project data."
                ),
            ),
        ),
        migrations.AlterModelManagers(
            name="projectspecificfields",
            managers=[
                (
                    "objects",
                    core.models.project_metadata.ProjectSpecificFieldsManager(),
                ),
            ],
        ),
        migrations.RunPython(
            create_obsolete_project_specific_fields,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
