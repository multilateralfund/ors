import json
import logging

from django.conf import settings

from core.import_data.utils import delete_old_data, get_meeting_by_number
from core.import_data.utils import get_object_by_code
from core.models import Project
from core.models.project import ProjectComment


logger = logging.getLogger(__name__)


def import_project_comments():
    file_path = settings.IMPORT_DATA_DIR / "progress_report" / "tbComment.json"
    delete_old_data(ProjectComment, file_path)

    with file_path.open("r") as f:
        comments = json.load(f)

    for index, item in enumerate(comments):
        project = get_object_by_code(Project, item["Code"], "code", index)
        if not project:
            continue
        meeting = get_meeting_by_number(item["Meeting of report"], index)
        meeting_string = None
        if not meeting:
            meeting_string = item["Meeting of report"]

        ProjectComment.objects.create(
            **{
                "source_file": file_path,
                "project": project,
                "meeting_of_report": meeting,
                "meeting_of_report_string": meeting_string,
                "secretariat_comment": item.get("Secretariat's Comment"),
                "agency_response": item.get("Agency's Response"),
            }
        )
