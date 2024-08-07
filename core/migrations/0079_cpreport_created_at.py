# Generated by Django 4.2 on 2024-04-01 12:25

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0078_blend_is_legacy_blend_remarks"),
    ]

    operations = [
        migrations.AddField(
            model_name="cpreport",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now,
                help_text="Date of creation of the report archive",
            ),
            preserve_default=False,
        ),
    ]
