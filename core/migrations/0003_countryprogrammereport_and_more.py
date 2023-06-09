# Generated by Django 4.2 on 2023-04-09 17:48

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0002_blendcomponents_group_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="CountryProgrammeReport",
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
                ("name", models.CharField(max_length=248)),
                ("year", models.IntegerField()),
                ("comment", models.TextField(blank=True, null=True)),
            ],
        ),
        migrations.RenameField(
            model_name="country",
            old_name="country_iso",
            new_name="iso3",
        ),
        migrations.RenameField(
            model_name="country",
            old_name="country_m49",
            new_name="m49",
        ),
        migrations.RenameField(
            model_name="country",
            old_name="country_name",
            new_name="name",
        ),
        migrations.RenameField(
            model_name="usage",
            old_name="usage_name",
            new_name="name",
        ),
        migrations.RemoveField(
            model_name="usage",
            name="usage_description",
        ),
        migrations.RemoveField(
            model_name="usage",
            name="usage_parent",
        ),
        migrations.AddField(
            model_name="country",
            name="is_lvc",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="usage",
            name="description",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="usage",
            name="full_name",
            field=models.CharField(default="test", max_length=248),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="usage",
            name="parent",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="core.usage",
            ),
        ),
        migrations.CreateModel(
            name="Price",
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
                ("value", models.FloatField()),
                ("comment", models.TextField(blank=True, null=True)),
                (
                    "blend",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.blend"
                    ),
                ),
                (
                    "country_programme_report",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.countryprogrammereport",
                    ),
                ),
                (
                    "substance",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.substance"
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="countryprogrammereport",
            name="country",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="core.country"
            ),
        ),
    ]
