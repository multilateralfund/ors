# Generated by Django 4.2.17 on 2025-06-13 10:01

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0211_remove_bpactivity_comment_secretariat"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="bpactivity",
            name="remarks_additional",
        ),
    ]
