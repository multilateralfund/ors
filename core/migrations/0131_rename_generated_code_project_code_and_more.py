# Generated by Django 4.2.11 on 2024-09-02 10:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0130_rename_code_project_legacy_code_project_bp_activity"),
    ]

    operations = [
        migrations.RenameField(
            model_name="project",
            old_name="generated_code",
            new_name="code",
        ),
        migrations.AlterField(
            model_name="metaproject",
            name="type",
            field=models.CharField(
                choices=[
                    ("Multi-year agreement", "Multi-year agreement"),
                    ("Individual", "Individual"),
                ],
                max_length=255,
            ),
        ),
    ]
