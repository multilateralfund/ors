# Generated by Django 4.2.11 on 2024-10-23 16:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0159_payment_status"),
    ]

    operations = [
        migrations.RenameField(
            model_name="invoice",
            old_name="amount",
            new_name="amount_local_currency",
        ),
        migrations.RemoveField(
            model_name="invoice",
            name="is_arrears",
        ),
        migrations.RemoveField(
            model_name="invoice",
            name="replenishment",
        ),
        migrations.RemoveField(
            model_name="payment",
            name="replenishment",
        ),
        migrations.AddField(
            model_name="invoice",
            name="amount_usd",
            field=models.DecimalField(decimal_places=15, default=0, max_digits=30),
            preserve_default=False,
        ),
    ]
