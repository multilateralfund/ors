# Generated by Django 4.2.11 on 2024-09-12 14:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0135_update_archives_created_at"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="user_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("agency_inputter", "Agency inputter"),
                    ("agency_submitter", "Agency submitter"),
                    ("country_user", "Country user"),
                    ("country_submitter", "Country submitter"),
                    ("secretariat", "Secretariat"),
                    ("viewer", "Viewer"),
                    ("stakeholder", "Stakeholder"),
                    ("treasurer", "Treasurer"),
                ],
                max_length=50,
            ),
        ),
    ]
