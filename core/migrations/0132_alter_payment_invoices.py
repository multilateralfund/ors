# Generated by Django 4.2.11 on 2024-09-09 12:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0131_rename_generated_code_project_code_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="payment",
            name="invoices",
            field=models.ManyToManyField(
                blank=True, related_name="payments", to="core.invoice"
            ),
        ),
    ]
