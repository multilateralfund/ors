# Generated by Django 4.2 on 2023-08-18 07:04

import django.core.files.storage
from django.db import migrations, models
import pathlib


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0043_remove_project_project_file_projectfile"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="projectfile",
            options={"get_latest_by": "date_created"},
        ),
        migrations.AddField(
            model_name="project",
            name="date_per_decision",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="project",
            name="decisions",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="project",
            name="multi_year",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="project",
            name="mya_code",
            field=models.CharField(blank=True, max_length=128, null=True),
        ),
        migrations.AddField(
            model_name="project",
            name="stage",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="projectsubsector",
            name="multi_year",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="projectfile",
            name="file",
            field=models.FileField(
                storage=django.core.files.storage.FileSystemStorage(
                    location=pathlib.PurePosixPath("/app/.fs/protected_media")
                ),
                upload_to="project_files/",
            ),
        ),
    ]
