# Generated by Django 4.2.11 on 2024-09-23 09:04

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0136_alter_user_user_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="fermgainloss",
            name="year",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="fermgainloss",
            name="country",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="ferm_gain_loss",
                to="core.country",
            ),
        ),
        migrations.AddConstraint(
            model_name="fermgainloss",
            constraint=models.UniqueConstraint(
                fields=("country", "year"), name="unique_ferm_country_year"
            ),
        ),
    ]
