# Generated by Django 4.2.17 on 2025-07-07 08:29

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0217_projectfield_sort_order"),
    ]

    operations = [
        migrations.AddField(
            model_name="metaproject",
            name="date_created",
            field=models.DateTimeField(
                auto_now_add=True, default=django.utils.timezone.now
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="metaproject",
            name="date_updated",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name="metaproject",
            name="new_code",
            field=models.CharField(
                blank=True,
                help_text="\n        New code generated for the metaproject. The code will include all clusters,\n        unlike the old code which allows only one.\n        Format: country_code/cluster_code1/cluster_code2/.../serial_number\n        ",
                max_length=255,
                null=True,
            ),
        ),
    ]
