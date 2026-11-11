from django.db import migrations, models
from django.db.models import Max

# HISTORY_DESCRIPTION_APPROVE_V3, logged when MLFS approves a PCR
APPROVE_HISTORY_DESCRIPTION = "PCR approved"


def set_approval_dates(apps, schema_editor):
    PCR = apps.get_model("core", "PCR")
    approved_pcrs = PCR._base_manager.filter(
        latest_pcr__isnull=True, status="Approved version"
    ).annotate(
        approved_at=Max(
            "pcr_history__created_at",
            filter=models.Q(pcr_history__description=APPROVE_HISTORY_DESCRIPTION),
        )
    )
    for pcr in approved_pcrs:
        if pcr.approved_at:
            pcr.approval_date = pcr.approved_at.date()
            pcr.save(update_fields=["approval_date"])


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0345_pcr_version_statuses"),
    ]

    operations = [
        migrations.AddField(
            model_name="pcr",
            name="approval_date",
            field=models.DateField(
                blank=True, help_text="Approval date (version 3)", null=True
            ),
        ),
        migrations.RunPython(set_approval_dates, migrations.RunPython.noop),
    ]
