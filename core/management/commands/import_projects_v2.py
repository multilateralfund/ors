import logging

from django.core.management import BaseCommand
from django.db import transaction

from core.models.business_plan import BPActivity, BPChemicalType
from core.models.project import MetaProject, Project
from core.models.project_metadata import (
    ProjectCluster,
    ProjectSector,
    ProjectSubSector,
    ProjectType,
)
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

def mark_obsolete_values():

    BP_CHEMICAL_TYPE_OBSOLETES = ["MBR", "PRO MBR"]

    PROJECT_CLUSTER_OBSOLETES = [
        "CFC Individual",
        "CFC Phase-out Plans",
        "CFC Production Phase out Plans",
        "Country Programme",
        "Other ODS Individual",
        "Other ODS Production Phase out Plans",
        "Other ODS Sector Plans",
    ]
    PROJECT_SECTOR_OBSOLETES = [
        "Fumigant",
        "Pre-CAP",
        "Process agent",
        "Sterilant",
        "Tobacco Fluffing",
    ]

    PROJECT_TYPES_OBSOLETES = [
        "DOC",
        "Country programme preparation",
    ]

    PROJECT_SUBSECTOR_OBSOLETES = [
        "Banking",
        "CFC closure",
        "CFC conversion",
        "CFC-113",
        "Combined CFC-113 and TCA",
        "Commercial Refrigeration",
        "CTC",
        "CTC phase out",
        "Domestic Refrigeration",
        "End-user",
        "Halon closure",
        "Halon conversion",
        "Industrial and commercial AC (ICR)",
        "MB closure",
        "Methyl bromide",
        "Network",
        "Non-investment programme",
        "ODS closure",
        "Other Aerosol",
        "Other Pre-CAP",
        "Other Process agent",
        "Other Sterilant",
        "Other Tobacco Fluffing",
        "Policy paper",
        "Sterilant",
        "TCA",
        "TCA closure",
        "Tobacco fluffing",
        "Transportation refrigeration",
    ]

    BPChemicalType.objects.filter(name__in=BP_CHEMICAL_TYPE_OBSOLETES).update(
        obsolete=True
    )
    logger.info("✅ Successfully marked obsolete values in BPChemicalType.")

    ProjectCluster.objects.filter(name__in=PROJECT_CLUSTER_OBSOLETES).update(
        obsolete=True
    )
    logger.info("✅ Successfully marked obsolete values in ProjectCluster.")

    ProjectSector.objects.filter(name__in=PROJECT_SECTOR_OBSOLETES).update(
        obsolete=True
    )
    logger.info("✅ Successfully marked obsolete values in ProjectSector.")

    ProjectType.objects.filter(name__in=PROJECT_TYPES_OBSOLETES).update(obsolete=True)
    logger.info("✅ Successfully marked obsolete values in ProjectType.")

    ProjectSubSector.objects.filter(name__in=PROJECT_SUBSECTOR_OBSOLETES).update(
        obsolete=True
    )
    logger.info("✅ Successfully marked obsolete values in ProjectSubSector.")

def migrate_subsectors_sector_data():
    """
    Subsectors has a FK to Sector, but Subsectors can be used in multiple sectors.
    This script migrates sector to sectors in the subsector model and migrates the existing
    data to only one entry.
    """
    logger.info("⏳ Migrating subsectors sector data...")

    subsectors_with_the_same_name_list = {}
    for subsector in ProjectSubSector.objects.all():
        if subsector.name not in subsectors_with_the_same_name_list:
            subsectors_with_the_same_name_list[subsector.name] = [subsector]
        else:
            subsectors_with_the_same_name_list[subsector.name].append(subsector)

    for (
        name,
        subsectors_with_the_same_name,
    ) in subsectors_with_the_same_name_list.items():
        if len(subsectors_with_the_same_name) > 1:
            logger.info(f"Subsector {name} has multiple entries, migrating to sectors.")
            first_subsector = subsectors_with_the_same_name[0]
            sectors = [subsector.sector for subsector in subsectors_with_the_same_name]
            first_subsector.sectors.set(sectors)
            first_subsector.save()

            for subsector_to_delete in subsectors_with_the_same_name[1:]:
                projects_with_subsector = Project.objects.filter(
                    subsectors=subsector_to_delete
                )
                for project in projects_with_subsector:
                    # Add the first subsector to the project
                    project.subsectors.add(first_subsector)
                    project.subsectors.remove(subsector_to_delete)
                    project.save()
                    logger.info(
                        f"Adding subsector {first_subsector.name} to project {project.code}"
                    )

                bp_activities_with_subsector = BPActivity.objects.filter(
                    subsector=subsector_to_delete
                )
                for activity in bp_activities_with_subsector:
                    # Add the first subsector to the activity
                    activity.subsector = first_subsector
                    activity.save()
                    logger.info(
                        f"Adding subsector {first_subsector.name} to BPActivity {activity.id}"
                    )
            for subsector in subsectors_with_the_same_name[1:]:
                logger.info(
                    f"Deleting subsector {subsector.name} with ID {subsector.id}"
                )
                subsector.delete()
        else:
            first_subsector = subsectors_with_the_same_name[0]
            sectors = [subsector.sector for subsector in subsectors_with_the_same_name]
            first_subsector.sectors.set(sectors)
            first_subsector.save()
    logger.info("✅ Successfully migrated subsectors sector data.")

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
                "mark_obsolete_values",
                "migrate-subsectors-sector-data",
            ],
        )

    def handle(self, *args, **kwargs):
        imp_type = kwargs["type"]

        if imp_type in ["set-new-code-meta-projects"]:
            set_new_code_meta_projects()
        elif imp_type in ["set-meta-project-for-existing-projects"]:
            set_meta_project_for_existing_projects()
        elif imp_type == "mark_obsolete_values":
            mark_obsolete_values()
        elif imp_type == "migrate-subsectors-sector-data":
            migrate_subsectors_sector_data()
        else:
            logger.error(f"Unknown import type: {imp_type}")
