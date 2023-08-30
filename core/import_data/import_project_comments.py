import json
import logging

from django.conf import settings

from core.import_data.utils import delete_old_data
from core.import_data.utils import get_object_by_code
from core.models import Project
from core.models.project import ProjectComment


logger = logging.getLogger(__name__)


def import_project_comments():
    file_path = settings.IMPORT_DATA_DIR / "progress_report" / "tbComment.json"
    delete_old_data(ProjectComment, file_path, logger)

    with file_path.open("r") as f:
        comments = json.load(f)

    for index, item in enumerate(comments):
        project = get_object_by_code(Project, item["Code"], "code", index, logger)
        if not project:
            continue

        ProjectComment.objects.create(
            **{
                "source_file": file_path,
                "project": project,
                "meeting_of_report": item["Meeting of report"],
                "secretariat_comment": item.get("Secretariat's Comment"),
                "agency_response": item.get("Agency's Response"),
            }
        )
