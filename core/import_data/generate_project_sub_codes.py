import logging

from django.db import transaction

from core.models.project import Project
from core.utils import get_project_sub_code

logger = logging.getLogger(__name__)


def generate_project_sub_codes():
    """
    Generate project sub codes
    """
    projects = Project.objects.select_related(
        "country",
        "cluster",
        "agency",
        "project_type",
        "approval_meeting",
        "meeting_transf",
    ).all()

    for project in projects:
        project.generated_code = get_project_sub_code(
            project.country,
            project.cluster,
            project.serial_number,
            project.agency,
            project.project_type,
            project.approval_meeting,
            project.meeting_transf,
        )
        project.save()


@transaction.atomic
def generate_all_project_sub_codes():
    """
    Generate all project sub codes
    """
    logger.info("⏳ generating project sub codes")
    generate_project_sub_codes()
    logger.info("✅ project sub codes generated")
