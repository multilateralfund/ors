# Generated by Django 4.2.11 on 2024-08-21 12:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0123_cpprices_is_fob_cpprices_is_retail_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="payment",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
    ]
