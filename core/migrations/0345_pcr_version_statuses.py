from django.db import migrations, models

STATUS_CHOICES = [
    ("Draft", "Draft"),
    ("Initial submission", "Initial submission"),
    ("Revision", "Revision"),
    ("Revision (adjustments requested)", "Revision (adjustments requested)"),
    ("Approved version", "Approved version"),
]

OLD_TO_NEW_STATUS = {
    "Submitted": "Revision",
    "Adjustments requested": "Revision (adjustments requested)",
    "Final": "Approved version",
}


def rename_statuses(apps, schema_editor, mapping):
    PCR = apps.get_model("core", "PCR")
    OLD_PCR = apps.get_model("core", "OLD_PCR")
    OLD_IndividualPCR = apps.get_model("core", "OLD_IndividualPCR")
    for model in (PCR, OLD_PCR, OLD_IndividualPCR):
        for old_status, new_status in mapping.items():
            model._base_manager.filter(status=old_status).update(status=new_status)


def forwards(apps, schema_editor):
    PCR = apps.get_model("core", "PCR")
    # The archived version 1 is the one that was submitted to MLFS
    PCR._base_manager.filter(
        latest_pcr__isnull=False, version=1, status="Draft"
    ).update(status="Initial submission")
    rename_statuses(apps, schema_editor, OLD_TO_NEW_STATUS)


def backwards(apps, schema_editor):
    rename_statuses(
        apps,
        schema_editor,
        {
            "Initial submission": "Draft",
            **{new: old for old, new in OLD_TO_NEW_STATUS.items()},
        },
    )


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0344_old_individual_pcr"),
    ]

    operations = [
        migrations.AlterField(
            model_name="pcr",
            name="status",
            field=models.CharField(
                choices=STATUS_CHOICES,
                default="Draft",
                help_text="Workflow status of the PCR",
                max_length=32,
            ),
        ),
        migrations.AlterField(
            model_name="old_pcr",
            name="status",
            field=models.CharField(
                choices=STATUS_CHOICES,
                default="Approved version",
                help_text="Workflow status of the PCR",
                max_length=32,
            ),
        ),
        migrations.AlterField(
            model_name="old_individualpcr",
            name="status",
            field=models.CharField(
                choices=STATUS_CHOICES,
                default="Approved version",
                help_text="Workflow status of the PCR",
                max_length=32,
            ),
        ),
        migrations.RunPython(forwards, backwards),
    ]
