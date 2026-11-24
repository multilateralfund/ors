from django.db import migrations, models

STATUS_CHOICES = [
    ("Draft", "Draft"),
    ("Revision", "Revision"),
    ("Submitted", "Submitted"),
    ("Endorsed", "Endorsed"),
]

# The order matters, "Revision" is renamed before it is reused
OLD_TO_NEW_STATUS = [
    ("Revision", "Submitted"),
    ("Revision (adjustments requested)", "Revision"),
    ("Approved version", "Endorsed"),
    # the archived version 1 keeps the status it had when it was submitted
    ("Initial submission", "Draft"),
]

NEW_TO_OLD_STATUS = [
    ("Revision", "Revision (adjustments requested)"),
    ("Submitted", "Revision"),
    ("Endorsed", "Approved version"),
]


def rename_statuses(apps, mapping):
    PCR = apps.get_model("core", "PCR")
    OLD_PCR = apps.get_model("core", "OLD_PCR")
    OLD_IndividualPCR = apps.get_model("core", "OLD_IndividualPCR")
    for model in (PCR, OLD_PCR, OLD_IndividualPCR):
        for old_status, new_status in mapping:
            model._base_manager.filter(status=old_status).update(status=new_status)


def forwards(apps, schema_editor):
    rename_statuses(apps, OLD_TO_NEW_STATUS)


def backwards(apps, schema_editor):
    rename_statuses(apps, NEW_TO_OLD_STATUS)
    PCR = apps.get_model("core", "PCR")
    PCR._base_manager.filter(
        latest_pcr__isnull=False, version=1, status="Draft"
    ).update(status="Initial submission")


def status_field(default):
    return models.CharField(
        choices=STATUS_CHOICES,
        default=default,
        help_text="Workflow status of the PCR",
        max_length=32,
    )


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0348_pcr_export"),
    ]

    operations = [
        migrations.AlterField(
            model_name="pcr",
            name="status",
            field=status_field("Draft"),
        ),
        migrations.AlterField(
            model_name="old_pcr",
            name="status",
            field=status_field("Endorsed"),
        ),
        migrations.AlterField(
            model_name="old_individualpcr",
            name="status",
            field=status_field("Endorsed"),
        ),
        migrations.AlterField(
            model_name="pcr",
            name="approval_date",
            field=models.DateField(
                blank=True, help_text="Latest endorsement date (version 3)", null=True
            ),
        ),
        migrations.AlterField(
            model_name="pcr",
            name="revised_submission_date",
            field=models.DateField(
                blank=True,
                help_text="Latest resubmission date, after the PCR was sent back for revision",
                null=True,
            ),
        ),
        migrations.RunPython(forwards, backwards),
    ]
