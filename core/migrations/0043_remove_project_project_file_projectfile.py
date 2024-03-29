# Generated by Django 4.2 on 2023-08-14 05:43

import django.core.files.storage
from django.db import migrations, models
import django.db.models.deletion
import pathlib


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0042_project_coop_agencies_alter_projectodsodp_odp"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="project",
            name="project_file",
        ),
        migrations.CreateModel(
            name="ProjectFile",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "file",
                    models.FileField(
                        storage=django.core.files.storage.FileSystemStorage(
                            location=pathlib.PurePosixPath(
                                "/home/kiro/PycharmProjects/ors/.fs/protected_media"
                            )
                        ),
                        upload_to="project_files/",
                    ),
                ),
                ("date_created", models.DateTimeField(auto_now_add=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="files",
                        to="core.project",
                    ),
                ),
            ],
        ),
    ]
