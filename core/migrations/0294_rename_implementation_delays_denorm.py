from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0293_alter_user_user_type"),
    ]

    operations = [
        migrations.RenameField(
            model_name="annualprojectreport",
            old_name="implementation_delays_status_report_decisions_denorm",
            new_name="implementation_delays_status_report_decisions",
        ),
    ]
