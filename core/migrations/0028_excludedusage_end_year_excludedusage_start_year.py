# Generated by Django 4.2 on 2023-06-19 09:31

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0027_admchoice_adm_row_alter_admrecord_column"),
    ]

    operations = [
        migrations.AddField(
            model_name="excludedusage",
            name="end_year",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="excludedusage",
            name="start_year",
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
