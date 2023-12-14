import logging

from django.db import transaction

from core.models.project import Project

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
        project.set_generated_code()


@transaction.atomic
def generate_all_project_sub_codes():
    """
    Generate all project sub codes
    """
    logger.info("⏳ generating project sub codes")
    generate_project_sub_codes()
    logger.info("✅ project sub codes generated")
