# Generated by Django 4.2 on 2023-10-25 12:17

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0053_alter_blend_displayed_in_all_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="DelayCategory",
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
                ("name", models.CharField(blank=True, max_length=255, null=True)),
                ("sort_order", models.FloatField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="LearnedLessonCategory",
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
                ("name", models.CharField(blank=True, max_length=255, null=True)),
                ("sort_order", models.FloatField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="MetaProject",
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
                ("type", models.CharField(max_length=255)),
                (
                    "pcr_project_id",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
            ],
        ),
        migrations.CreateModel(
            name="PCRSector",
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
                ("name", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "sector_type",
                    models.CharField(
                        blank=True,
                        choices=[("1", "Investment"), ("2", "Non-investment")],
                        max_length=255,
                        null=True,
                    ),
                ),
            ],
        ),
        migrations.RemoveField(
            model_name="project",
            name="multi_year",
        ),
        migrations.CreateModel(
            name="PCRLearnedLessons",
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
                ("description", models.TextField(blank=True, null=True)),
                (
                    "source_file",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                (
                    "agency",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.agency"
                    ),
                ),
                (
                    "category",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.learnedlessoncategory",
                    ),
                ),
                (
                    "meta_project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.metaproject",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="PCRDelayExplanation",
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
                ("delay_cause", models.TextField(blank=True, null=True)),
                ("measures_to_overcome", models.TextField(blank=True, null=True)),
                (
                    "source_file",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                (
                    "agency",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.agency"
                    ),
                ),
                (
                    "category",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.delaycategory",
                    ),
                ),
                (
                    "meta_project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.metaproject",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="PCRActivity",
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
                ("type_of_activity", models.TextField(blank=True, null=True)),
                ("planned_output", models.TextField(blank=True, null=True)),
                ("actual_activity_output", models.TextField(blank=True, null=True)),
                ("evaluation", models.IntegerField(blank=True, null=True)),
                ("explanation", models.TextField(blank=True, null=True)),
                (
                    "source_file",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                (
                    "meta_project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.metaproject",
                    ),
                ),
                (
                    "sector",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.pcrsector"
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "PCR activities",
            },
        ),
        migrations.AddField(
            model_name="project",
            name="meta_project",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="core.metaproject",
            ),
        ),
    ]
