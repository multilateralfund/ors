import logging

from django.db import transaction

from core.models import (
    MetaProject,
    Project,
)

logger = logging.getLogger(__name__)


@transaction.atomic
def clean_up_project_meta_project_attributes():
    """
    Clean up project attributes
    Clean up meta project attributes
    """
    # Set Meta Project umbrella_code

    meta_projects = MetaProject.objects.all()
    for meta_project in meta_projects:
        meta_project.umbrella_code = meta_project.code
    MetaProject.objects.bulk_update(meta_projects, ["umbrella_code"])

    projects_without_metacode = Project.objects.filter(
        meta_project__isnull=False,
        metacode__isnull=True,
        submission_status__name="Approved",
    )
    for project in projects_without_metacode:
        project.metacode = project.meta_project.umbrella_code
        project.save()

    logger.info("⏳ Populating umbrella_code for existing meta projects...")
    meta_projects = MetaProject.objects.all().prefetch_related(
        "projects__country", "projects__cluster"
    )

    for meta_project in meta_projects:
        project = meta_project.projects.filter(metacode__isnull=False).first()
        if not project:
            logger.warning(
                f"MetaProject {meta_project.id} has no associated projects. Skipping."
            )
            continue
        meta_project.country = project.country
        meta_project.cluster = project.cluster
        meta_project.save()
    logger.info("✅ Successfully populated umbrella_code for existing meta projects.")
