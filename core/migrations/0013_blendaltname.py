# Generated by Django 4.2 on 2023-05-16 12:34

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0012_rename_record_countryprogrammerecord_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="BlendAltName",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=256)),
                ("ozone_id", models.IntegerField(blank=True, null=True)),
                (
                    "blend",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.blend"
                    ),
                ),
            ],
        ),
    ]
