# Generated by Django 4.2.11 on 2024-10-13 08:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0151_remove_externalallocation__singleton_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="externalincomeannual",
            name="interest_earned_quarter_1",
        ),
        migrations.RemoveField(
            model_name="externalincomeannual",
            name="interest_earned_quarter_2",
        ),
        migrations.RemoveField(
            model_name="externalincomeannual",
            name="interest_earned_quarter_3",
        ),
        migrations.RemoveField(
            model_name="externalincomeannual",
            name="interest_earned_quarter_4",
        ),
        migrations.AddField(
            model_name="externalincomeannual",
            name="quarter",
            field=models.IntegerField(default=None, null=True),
        ),
        migrations.AddField(
            model_name="externalincomeannual",
            name="triennial_start_year",
            field=models.IntegerField(default=None, null=True),
        ),
        migrations.AlterField(
            model_name="externalincomeannual",
            name="year",
            field=models.IntegerField(default=None, null=True),
        ),
    ]