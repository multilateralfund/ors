import json
import logging

from django.db import transaction

from core.models.project_metadata import ProjectStatus, ProjectSubmissionStatus
from core.models.project import Project

logger = logging.getLogger(__name__)


@transaction.atomic
def clean_up_project_statuses():
    """
    Clean up project statuses
    Remove outdated statuses and add new ones
    """
    # remove Unknown status only if there are no projects with this status

    if Project.objects.really_all().filter(status__code="UNK").exists():
        logger.warning(
            "⚠️ Cannot remove 'Unknown' status, there are projects with this status."
        )
    else:
        ProjectStatus.objects.filter(code="UNK").delete()

    # change the status 'New submission' into 'N/A' and delete status 'New submission'

    new_submission_status, _ = ProjectStatus.objects.update_or_create(
        name="N/A",
        defaults={
            "code": "NA",
        },
    )
    Project.objects.really_all().filter(status__code="NEWSUB").update(
        status=new_submission_status
    )
    ProjectStatus.objects.filter(code="NEWSUB").delete()

    # change the status 'Newly approved' into 'Ongoing' and delete status 'Newly approved'

    on_going_status = ProjectStatus.objects.filter(name="Ongoing").first()
    Project.objects.really_all().filter(status__code="NEW").update(
        status=on_going_status
    )
    ProjectStatus.objects.filter(code="NEW").delete()


@transaction.atomic
def import_project_submission_statuses(file_path):
    """
    Import project submission statuses from file

    @param file_path = str (file path for import file)
    """

    with open(file_path, "r", encoding="utf8") as f:
        statuses_json = json.load(f)

    for status_json in statuses_json:
        status_data = {
            "name": status_json["STATUS"],
            "code": status_json["STATUS_CODE"],
        }
        ProjectSubmissionStatus.objects.update_or_create(
            name=status_data["name"], defaults=status_data
        )
