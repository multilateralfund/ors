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

logger = logging.getLogger(__name__)


@transaction.atomic
def populate_existing_projects_metacode():
    """
    Populate the metacode field in Project model using the MetaProject code.
    This function will update the metacode field for all Approved projects that have a code defined
    in their meta_project.
    """
    logger.info("⏳ Populating metacode for existing projects...")
    Project.objects.update(metacode=None)  # Reset existing metacode values
    projects_with_meta_project_code = Project.objects.really_all().filter(
        meta_project__code__isnull=False, submission_status__name="Approved"
    )
    for project in projects_with_meta_project_code:
        project.metacode = project.meta_project.code

    Project.objects.bulk_update(projects_with_meta_project_code, ["metacode"])
    logger.info("✅ Successfully populated metacode for existing projects.")


@transaction.atomic
def populate_existing_projects_lead_agency():
    """
    Populate the lead agency field in Project model using the MetaProject lead agency.
    This function will update the lead agency field for all projects that have a lead agency defined
    in their meta_project.
    """
    logger.info("⏳ Populating lead agency for existing projects...")
    projects_with_meta_project_lead_agency = Project.objects.really_all().filter(
        meta_project__lead_agency__isnull=False
    )
    for project in projects_with_meta_project_lead_agency:
        project.lead_agency = project.meta_project.lead_agency
    Project.objects.bulk_update(projects_with_meta_project_lead_agency, ["lead_agency"])
    logger.info("✅ Successfully populated lead agency for existing projects.")


def populate_existing_meta_projects_fields():
    """
    Populate the umbrella_code, cluster and country fields for the existing meta projects.
    The umbrella_code will be populated using the metacode of the first associated project.
    The cluster and country will be populated using the first associated project's cluster and country.
    """
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
        meta_project.umbrella_code = project.metacode
        meta_project.country = project.country
        meta_project.cluster = project.cluster
        meta_project.save()
    logger.info("✅ Successfully populated umbrella_code for existing meta projects.")


def remove_all_meta_project_associations():
    """
    Remove all associations between MetaProject and Project.
    The MetaProjects will only be used as an umbrella for associated projects, now that
    the metacode field was moved to the Project model.
    """
    logger.info("⏳ Removing all meta project associations...")
    projects = Project.objects.really_all().filter(meta_project__isnull=False)
    for project in projects:
        project.meta_project = None
    Project.objects.bulk_update(projects, ["meta_project"])

    MetaProject.objects.all().delete()
    logger.info("✅ Successfully removed all meta project associations.")


def populate_existing_projects_production():
    """
    The production attribute was added to the Project model after the initial data import.
    This function sets the production attribute for existing projects based on the production
    field of the project's cluster.
    """
    logger.info("⏳ Setting production attribute for existing projects...")
    production_clusters = ProjectCluster.objects.filter(production=True)
    projects_in_production_clusters = Project.objects.filter(
        cluster__in=production_clusters, production=False
    )
    projects_in_production_clusters.update(production=True)


def populate_existing_projects_category():
    """
    Populate the category field in Project model using the ProjectCluster category field.
    """
    logger.info("⏳ Populating category for existing projects...")
    projects = Project.objects.really_all().prefetch_related("cluster")
    for project in projects:
        if project.cluster and project.cluster.category == "MYA":
            project.category = "Multi-year agreement"
        else:
            project.category = "Individual"
    Project.objects.bulk_update(projects, ["category"])
    logger.info("✅ Successfully populated category for existing projects.")


def set_correct_version_for_existing_projects():
    """
    Set the correct version for existing projects based on the fields they have.
    """
    logger.info("⏳ Setting correct version for existing projects...")
    projects = Project.objects.filter(
        submission_status__name="Approved",
        version__lte=3,
    )
    projects.update(version=3)
    logger.info("✅ Successfully set correct version for existing projects.")


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
                "populate_existing_projects_metacode",
                "populate_existing_meta_projects_fields",
                "populate_existing_projects_lead_agency",
                "populate_existing_projects_category",
                "populate_existing_projects_production",
                "mark_obsolete_values",
                "set_correct_version_for_existing_projects",
                "migrate-subsectors-sector-data",
                "set-production-attribute",
                "remove-all-meta-project-associations",
            ],
        )

    def handle(self, *args, **kwargs):
        imp_type = kwargs["type"]

        if imp_type == "populate_existing_projects_metacode":
            populate_existing_projects_metacode()
        elif imp_type == "populate_existing_meta_projects_fields":
            populate_existing_meta_projects_fields()
        elif imp_type == "populate_existing_projects_lead_agency":
            populate_existing_projects_lead_agency()
        elif imp_type == "populate_existing_projects_category":
            populate_existing_projects_category()
        elif imp_type == "populate_existing_projects_production":
            populate_existing_projects_production()
        elif imp_type == "mark_obsolete_values":
            mark_obsolete_values()
        elif imp_type == "set_correct_version_for_existing_projects":
            set_correct_version_for_existing_projects()
        elif imp_type == "migrate-subsectors-sector-data":
            migrate_subsectors_sector_data()
        elif imp_type == "remove-all-meta-project-associations":
            remove_all_meta_project_associations()
        else:
            logger.error(f"Unknown import type: {imp_type}")
