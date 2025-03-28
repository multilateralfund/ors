# Generated by Django 4.2.17 on 2025-03-27 18:03

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0182_alter_user_user_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="decision",
            name="title",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="meeting",
            name="end_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="meeting",
            name="title",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="decision",
            name="description",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="decision",
            name="meeting",
            field=models.ForeignKey(
                default=None,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="core.meeting",
            ),
        ),
        migrations.AlterField(
            model_name="decision",
            name="number",
            field=models.CharField(max_length=16),
        ),
    ]
