# Generated by Django 4.2.11 on 2024-05-24 11:07

import core.models.business_plan
import django.core.files.storage
from django.db import migrations, models
import pathlib


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0093_alter_businessplan_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="businessplan",
            name="comment_agency",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="businessplan",
            name="comment_secretariat",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="businessplan",
            name="feedback_file",
            field=models.FileField(
                blank=True,
                storage=django.core.files.storage.FileSystemStorage(
                    location=pathlib.PurePosixPath("/app/.fs/protected_media")
                ),
                upload_to=core.models.business_plan.BusinessPlan.upload_path,
            ),
        ),
        migrations.AddField(
            model_name="businessplan",
            name="feedback_filename",
            field=models.CharField(blank=True, max_length=100),
        ),
    ]