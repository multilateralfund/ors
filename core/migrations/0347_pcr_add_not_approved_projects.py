from django.db import migrations

# Project.objects.for_pcr(), the projects shown in a PCR, now also includes the
# projects pending approval
PCR_SUBMISSION_STATUSES = ["Approved", "Submitted", "Recommended"]

# The PCRs the agency can still edit, so the added projects can be filled in
EDITABLE_PCR_STATUSES = ["Draft", "Revision (adjustments requested)"]


def add_missing_pcr_projects(apps, schema_editor):
    PCR = apps.get_model("core", "PCR")
    PCRProject = apps.get_model("core", "PCRProject")
    Project = apps.get_model("core", "Project")

    pcrs = PCR._base_manager.filter(
        latest_pcr__isnull=True, status__in=EDITABLE_PCR_STATUSES
    )
    for pcr in pcrs:
        missing_projects = (
            # the latest project versions, like Project.objects
            Project.objects.filter(
                latest_project__isnull=True,
                meta_project_id=pcr.meta_project_id,
                submission_status__name__in=PCR_SUBMISSION_STATUSES,
            )
            .exclude(category="Individual", status__name="Transferred")
            .exclude(pcr_projects__pcr=pcr)
        )
        PCRProject.objects.bulk_create(
            PCRProject(pcr=pcr, project=project) for project in missing_projects
        )


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0346_pcr_approval_date"),
    ]

    operations = [
        migrations.RunPython(add_missing_pcr_projects, migrations.RunPython.noop),
    ]
