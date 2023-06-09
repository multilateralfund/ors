# Generated by Django 4.2 on 2023-06-12 08:41

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0023_admchoice_admcolumn_admrow_admrecord"),
    ]

    operations = [
        migrations.AddField(
            model_name="countryprogrammerecord",
            name="export_quotas",
            field=models.DecimalField(
                blank=True, decimal_places=15, max_digits=25, null=True
            ),
        ),
        migrations.AlterField(
            model_name="countryprogrammerecord",
            name="exports",
            field=models.DecimalField(
                blank=True, decimal_places=15, max_digits=25, null=True
            ),
        ),
        migrations.AlterField(
            model_name="countryprogrammerecord",
            name="import_quotas",
            field=models.DecimalField(
                blank=True, decimal_places=15, max_digits=25, null=True
            ),
        ),
        migrations.AlterField(
            model_name="countryprogrammerecord",
            name="imports",
            field=models.DecimalField(
                blank=True, decimal_places=15, max_digits=25, null=True
            ),
        ),
        migrations.AlterField(
            model_name="countryprogrammerecord",
            name="manufacturing_blends",
            field=models.DecimalField(
                blank=True, decimal_places=15, max_digits=25, null=True
            ),
        ),
        migrations.AlterField(
            model_name="countryprogrammerecord",
            name="production",
            field=models.DecimalField(
                blank=True, decimal_places=15, max_digits=25, null=True
            ),
        ),
        migrations.AlterField(
            model_name="countryprogrammeusage",
            name="quantity",
            field=models.DecimalField(decimal_places=15, max_digits=25),
        ),
    ]
