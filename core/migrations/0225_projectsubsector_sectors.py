# Generated by Django 4.2.17 on 2025-07-22 13:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0224_remove_project_lead_agency"),
    ]

    operations = [
        migrations.AddField(
            model_name="projectsubsector",
            name="sectors",
            field=models.ManyToManyField(
                blank=True,
                help_text="List of sectors that this subsector belongs to",
                related_name="subsectors",
                to="core.projectsector",
            ),
        ),
    ]
