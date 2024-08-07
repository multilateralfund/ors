# Generated by Django 4.2 on 2024-04-04 14:12

import django.core.files.storage
from django.db import migrations, models
import django.db.models.deletion
import pathlib


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0080_cpreport_created_by_cpreport_event_description_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="country",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="core.country",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="user_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("agency", "Agency"),
                    ("country_user", "Country user"),
                    ("secretariat", "Secretariat"),
                    ("stakeholder", "Stakeholder"),
                ],
                max_length=50,
            ),
        ),
    ]
