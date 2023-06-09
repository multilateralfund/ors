# Generated by Django 4.2 on 2023-07-05 14:20

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0034_alter_blendcomponents_blend"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="admrecord",
            name="value_bool",
        ),
        migrations.RemoveField(
            model_name="admrecord",
            name="value_date",
        ),
        migrations.RemoveField(
            model_name="admrecord",
            name="value_float",
        ),
        migrations.AddField(
            model_name="admcolumn",
            name="display_name",
            field=models.CharField(default=1, max_length=248),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="admcolumn",
            name="max_year",
            field=models.IntegerField(default=1),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="admcolumn",
            name="min_year",
            field=models.IntegerField(default=1),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="admcolumn",
            name="section",
            field=models.CharField(
                choices=[("B", "B"), ("C", "C")], default=1, max_length=10
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="admcolumn",
            name="type",
            field=models.CharField(
                choices=[
                    ("text", "Text"),
                    ("float", "Float"),
                    ("date", "Date"),
                    ("boolean", "Boolean"),
                    ("choice", "Choice"),
                ],
                default=1,
                max_length=248,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="admrow",
            name="country_programme_report",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="adm_rows",
                to="core.cpreport",
            ),
        ),
        migrations.AddField(
            model_name="admrow",
            name="max_year",
            field=models.IntegerField(default=1),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="admrow",
            name="min_year",
            field=models.IntegerField(default=1),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="admrow",
            name="section",
            field=models.CharField(
                choices=[("B", "B"), ("C", "C"), ("D", "D")], default=1, max_length=10
            ),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="admcolumn",
            name="sort_order",
            field=models.FloatField(blank=True, null=True),
        ),
    ]
