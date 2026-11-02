from django.db import migrations, models


def prefilled_bool_to_choice(apps, schema_editor):
    PCRGenderMainstreaming = apps.get_model("core", "PCRGenderMainstreaming")
    PCRGenderMainstreaming.objects.filter(prefilled=True).update(prefilled_choice="Yes")
    PCRGenderMainstreaming.objects.filter(prefilled=False).update(prefilled_choice="No")


def prefilled_choice_to_bool(apps, schema_editor):
    PCRGenderMainstreaming = apps.get_model("core", "PCRGenderMainstreaming")
    PCRGenderMainstreaming.objects.update(
        prefilled=models.Case(
            models.When(prefilled_choice="Yes", then=models.Value(True)),
            default=models.Value(False),
        )
    )


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0335_pcr_history_revised_submission_date"),
    ]

    operations = [
        migrations.AddField(
            model_name="pcrgendermainstreaming",
            name="prefilled_choice",
            field=models.CharField(max_length=16, null=True),
        ),
        # Nullable so the reverse migration can re-add it to existing rows
        migrations.AlterField(
            model_name="pcrgendermainstreaming",
            name="prefilled",
            field=models.BooleanField(null=True),
        ),
        migrations.RunPython(prefilled_bool_to_choice, prefilled_choice_to_bool),
        migrations.RemoveField(
            model_name="pcrgendermainstreaming",
            name="prefilled",
        ),
        migrations.RenameField(
            model_name="pcrgendermainstreaming",
            old_name="prefilled_choice",
            new_name="prefilled",
        ),
        migrations.AlterField(
            model_name="pcrgendermainstreaming",
            name="prefilled",
            field=models.CharField(
                choices=[
                    ("Yes", "Yes"),
                    ("No", "No"),
                    ("Not applicable", "Not applicable"),
                ],
                help_text="Gender policy implemented",
                max_length=16,
            ),
        ),
    ]
