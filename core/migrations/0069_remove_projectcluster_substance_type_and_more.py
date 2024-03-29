# Generated by Django 4.2 on 2024-01-30 09:24

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0068_alter_project_substance_type_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="projectcluster",
            name="substance_type",
        ),
        migrations.AddField(
            model_name="projectcluster",
            name="category",
            field=models.CharField(
                choices=[
                    ("MYA", "Multi-year agreement"),
                    ("IND", "Individual"),
                    ("BOTH", "Both"),
                ],
                default="BOTH",
                max_length=255,
            ),
        ),
    ]
