# Generated by Django 4.2.11 on 2024-11-08 14:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0167_merge_20241107_0927"),
    ]

    operations = [
        migrations.AddField(
            model_name="scaleofassessmentversion",
            name="currency_date_range_end",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="scaleofassessmentversion",
            name="currency_date_range_start",
            field=models.CharField(blank=True, max_length=32),
        ),
    ]
