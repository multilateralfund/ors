# Generated by Django 4.2 on 2023-05-04 11:23

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0006_remove_countryprogrammereport_source_record_source_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Agency",
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
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField()),
            ],
        ),
        migrations.CreateModel(
            name="ProjectSector",
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
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="ProjectSubmission",
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
                ("project_number", models.IntegerField()),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("doc", "DOC"),
                            ("ins", "INS"),
                            ("inv", "INV"),
                            ("prp", "PRP"),
                            ("tas", "TAS"),
                        ],
                        max_length=164,
                    ),
                ),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("bilateral cooperation", "Bilateral cooperation"),
                            ("investment project", "Investment project"),
                            ("work programme amendment", "Work programme amendment"),
                            (
                                "other doc: cpg, policy paper, business plan",
                                "Other doc: CPG, policy paper, business plan",
                            ),
                        ],
                        max_length=164,
                    ),
                ),
                (
                    "programme_officer",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                ("title", models.CharField(max_length=256)),
                ("description", models.TextField(blank=True, null=True)),
                ("products_manufactured", models.TextField(blank=True, null=True)),
                ("impact", models.TextField(blank=True, null=True)),
                ("impact_tranche", models.TextField(blank=True, null=True)),
                ("is_HCFC", models.BooleanField(default=False)),
                ("is_HFC", models.BooleanField(default=False)),
                ("funds_allocated", models.FloatField(blank=True, null=True)),
                ("support_cost_13", models.FloatField(blank=True, null=True)),
                ("meeting1", models.TextField(blank=True, null=True)),
                ("date_approved", models.DateField(blank=True, null=True)),
                ("cost_effectivness", models.TextField(blank=True, null=True)),
                ("project_duration", models.IntegerField(blank=True, null=True)),
                ("date_completion", models.DateField(blank=True, null=True)),
                ("local_ownership", models.BooleanField(default=False)),
                ("capital_cost", models.FloatField(blank=True, null=True)),
                ("operating_cost", models.FloatField(blank=True, null=True)),
                ("contingency_cost", models.FloatField(blank=True, null=True)),
                ("project_cost", models.FloatField(blank=True, null=True)),
                ("status_code", models.TextField(blank=True, null=True)),
                ("date_received", models.DateField(blank=True, null=True)),
                ("revision_number", models.TextField(blank=True, null=True)),
                ("date_of_revision", models.DateField(blank=True, null=True)),
                ("agency_remarks", models.TextField(blank=True, null=True)),
                ("comments", models.TextField(blank=True, null=True)),
                ("withdrawn", models.BooleanField(default=False)),
                ("issue", models.BooleanField(default=False)),
                ("incomplete", models.BooleanField(default=False)),
                ("reviewed_mfs", models.BooleanField(default=False)),
                ("excom_provision", models.TextField(blank=True, null=True)),
                ("export_to", models.TextField(blank=True, null=True)),
                ("umbrella_project", models.BooleanField(default=False)),
                ("retroactive_finance", models.BooleanField(default=False)),
                ("loan", models.BooleanField(default=False)),
                ("intersessional_approval", models.BooleanField(default=False)),
                ("national_agency", models.TextField(blank=True, null=True)),
                ("issue_description", models.TextField(blank=True, null=True)),
                ("correspondance_no", models.IntegerField(blank=True, null=True)),
                ("plus", models.BooleanField(default=False)),
                ("source", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "agency",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.agency"
                    ),
                ),
                (
                    "country",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.country"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="SubmissionOdsOdp",
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
                ("ods_number", models.IntegerField()),
                ("ods_name", models.CharField(max_length=256)),
                ("odp", models.CharField(max_length=256)),
                ("ods_replacement", models.CharField(max_length=256)),
                (
                    "submission",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.projectsubmission",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="SubmissionAmount",
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
                ("amount", models.FloatField()),
                ("amount_13", models.FloatField(default=0, null=True)),
                ("impact", models.FloatField(default=0, null=True)),
                (
                    "cost_effectiveness",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("requested", "Requested"),
                            ("reviewed", "Reviewed"),
                            ("recomm", "Recommended"),
                            ("grand_total", "Grand Total"),
                            ("rsvd", "Grand Total RSVD"),
                        ],
                        max_length=164,
                    ),
                ),
                (
                    "submission",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.projectsubmission",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ProjectSubSector",
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
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, null=True)),
                (
                    "sector",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.projectsector",
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="projectsubmission",
            name="subsector",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="core.projectsubsector"
            ),
        ),
    ]
