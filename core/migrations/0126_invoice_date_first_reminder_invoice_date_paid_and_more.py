# Generated by Django 4.2.11 on 2024-08-22 08:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0125_remove_externalincome__singleton_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="invoice",
            name="date_first_reminder",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="invoice",
            name="date_paid",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="invoice",
            name="date_second_reminder",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="invoice",
            name="year",
            field=models.IntegerField(blank=True, null=True),
        ),
    ]