import logging

from django.core.management import BaseCommand
from django.db import transaction

from core.models.project import MetaProject, Project
from core.utils import get_meta_project_new_code, get_meta_project_code

logger = logging.getLogger(__name__)


@transaction.atomic
def set_new_code_meta_projects():
    """
    Set new codes for MetaProjects based on the existing projects.
    This function will update the MetaProject codes to a new format.
    """
    logger.info("⏳ Setting new codes for MetaProjects...")

    # Get all MetaProjects
    meta_projects = MetaProject.objects.all()

    for meta_project in meta_projects:
        new_code = get_meta_project_new_code(meta_project.projects.all())
        logger.info(f"Setting MetaProject {meta_project.code} to new code {new_code}")
        meta_project.new_code = new_code
        meta_project.save()


@transaction.atomic
def set_meta_project_for_existing_projects():
    """Set a MetaProject for existing projects that do not have one."""

    logger.info("⏳ Setting MetaProject for existing projects...")
    # Set MetaProject FK for all existing projects
    projects_without_meta_projects = Project.objects.filter(meta_project__isnull=True)
    for project in projects_without_meta_projects:

        logger.info(
            f"Project {project.code} ({project.title}) does not have a MetaProject."
        )

        # Create a new MetaProject for the project
        code = get_meta_project_code(
            project.country, project.cluster, project.serial_number_legacy
        )
        new_code = get_meta_project_new_code(projects_without_meta_projects)
        logger.info(
            f"Creating new MetaProject with code {new_code} for project {project.code}"
        )
        meta_project = MetaProject.objects.create(
            code=code,
            new_code=new_code,
            lead_agency=project.agency,
            type=MetaProject.MetaProjectType.IND,
        )
        project.meta_project = meta_project

    Project.objects.bulk_update(projects_without_meta_projects, ["meta_project"])
    logger.info("✅ Successfully set MetaProject for existing projects.")


class Command(BaseCommand):
    help = """
        Import projects v2.
        This script should be used for the new project information and for migrating the existing data
        to the new format.
        params:
            - migrate-existing-data => migrate existing data to the new format
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "type",
            type=str,
            help="Import type",
            default="all",
            choices=[
                "set-new-code-meta-projects",
                "set-meta-project-for-existing-projects",
            ],
        )

    def handle(self, *args, **kwargs):
        imp_type = kwargs["type"]

        if imp_type in ["set-new-code-meta-projects"]:
            set_new_code_meta_projects()
        elif imp_type in ["set-meta-project-for-existing-projects"]:
            set_meta_project_for_existing_projects()
        else:
            logger.error(f"Unknown import type: {imp_type}")
