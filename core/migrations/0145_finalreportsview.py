# Generated by Django 4.2.11 on 2024-10-02 10:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0144_create_view_for_final_reports"),
    ]

    operations = [
        migrations.CreateModel(
            name="FinalReportsView",
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
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True, help_text="Date of creation of the report"
                    ),
                ),
                ("name", models.CharField(max_length=248)),
                ("year", models.IntegerField()),
                (
                    "status",
                    models.CharField(
                        choices=[("draft", "Draft"), ("final", "Final")],
                        default="final",
                        max_length=10,
                    ),
                ),
                ("version", models.FloatField(default=1)),
                (
                    "reporting_entry",
                    models.CharField(blank=True, max_length=248, null=True),
                ),
                (
                    "reporting_email",
                    models.CharField(blank=True, max_length=248, null=True),
                ),
                ("submission_date", models.DateField(blank=True, null=True)),
                ("comment", models.TextField(blank=True, null=True)),
                ("is_archive", models.BooleanField()),
            ],
            options={
                "db_table": "final_reports_view",
                "managed": False,
            },
        ),
    ]