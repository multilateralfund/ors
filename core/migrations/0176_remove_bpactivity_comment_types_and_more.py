# Generated by Django 4.2.16 on 2024-12-05 11:03

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0175_merge_20241202_1526"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="bpactivity",
            name="comment_types",
        ),
        migrations.RemoveField(
            model_name="bpactivity",
            name="is_updated",
        ),
        migrations.AddField(
            model_name="bpactivityvalue",
            name="value_co2",
            field=models.DecimalField(
                blank=True, decimal_places=15, max_digits=25, null=True
            ),
        ),
        migrations.AddField(
            model_name="businessplan",
            name="decision",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="core.decision",
            ),
        ),
        migrations.AddField(
            model_name="businessplan",
            name="meeting",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="core.meeting",
            ),
        ),
        migrations.AlterField(
            model_name="bpfile",
            name="status",
            field=models.CharField(
                choices=[("Submitted", "Submitted"), ("Endorsed", "Endorsed")],
                default="Endorsed",
                max_length=32,
            ),
        ),
        migrations.AlterField(
            model_name="businessplan",
            name="status",
            field=models.CharField(
                choices=[("Submitted", "Submitted"), ("Endorsed", "Endorsed")],
                default="Endorsed",
                max_length=32,
            ),
        ),
        migrations.DeleteModel(
            name="CommentType",
        ),
    ]