import logging

from django.db import transaction

from core.models import Project

from core.utils import get_meta_project

logger = logging.getLogger(__name__)


@transaction.atomic
def fill_meta_project_for_projects_in_submission():
    """
    Generate/Assign meta projects for not approved MYA projects that do not have a meta project linked to them.
    """
    projects = (
        Project.objects.really_all()
        .filter(
            category=Project.Category.MYA,
            meta_project__isnull=True,
            status__name="N/A",
        )
        .order_by("date_created")
    )
    for project in projects:
        project.meta_project = get_meta_project(project)
        project.save()
        logger.info(
            f"Meta project {project.meta_project.umbrella_code} assigned to project {project.code} in submission"
        )
