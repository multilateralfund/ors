# Generated by Django 4.2.16 on 2024-12-11 16:39

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0177_alter_bpactivity_lvc_status"),
    ]

    operations = [
        migrations.AlterField(
            model_name="bpactivity",
            name="bp_chemical_type",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="core.bpchemicaltype",
            ),
        ),
        migrations.AlterField(
            model_name="bpactivity",
            name="lvc_status",
            field=models.CharField(
                blank=True,
                choices=[
                    ("LVC", "LVC"),
                    ("Non-LVC", "Non-LVC"),
                    ("Regional", "Regional"),
                    ("Global", "Global"),
                    ("NDR", "NDR"),
                    ("Undefined", "Undefined"),
                ],
                max_length=32,
            ),
        ),
        migrations.AlterField(
            model_name="bpactivity",
            name="project_type",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="core.projecttype",
            ),
        ),
    ]