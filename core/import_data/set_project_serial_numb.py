import logging

from django.db import transaction
from django.db.models import Min
from core.models.country import Country

from core.models.project import MetaProject, Project
from core.models.project_metadata import ProjectCluster
from core.utils import get_meta_project_code, get_project_sub_code

logger = logging.getLogger(__name__)


def set_serial_number():
    """
    Set project serial numbers
    For each country:
    - order by meeting number and serial_number_legacy (asc)
    - set serial_number based on the order
    """

    countries = Country.objects.all()
    for country in countries:
        projects = (
            Project.objects.select_related("meeting", "cluster")
            .filter(country_id=country.id, legacy_code__isnull=False)
            .order_by("meeting__number", "serial_number_legacy")
        )
        for i, project in enumerate(projects):
            project.code = get_project_sub_code(
                country,
                project.cluster,
                project.agency,
                project.project_type,
                project.sector,
                project.meeting,
                project.meeting_transf,
                i + 1,
            )
            project.serial_number = i + 1
            project.save()


def set_meta_serial_number():
    """
    Set meta serial numbers for projects
    For each country and cluster (meta project) and meta project category (MYA / IND):
    - order by meeting number and serial_number_legacy (asc)
    - set serial_number based on the order and the pair country/cluster
    """
    countries = Country.objects.all()
    for country in countries:
        projects = (
            Project.objects.select_related()
            .filter(
                legacy_code__isnull=False,
                country_id=country.id,
                meta_project__isnull=False,
            )
            .values("cluster_id", "meta_project_id")
            .annotate(min_serial_number=Min("serial_number"))
            .order_by("min_serial_number")
        )
        for i, project in enumerate(projects):
            cluster = ProjectCluster.objects.filter(pk=project["cluster_id"]).first()
            meta_code = get_meta_project_code(country, cluster, i + 1)
            MetaProject.objects.filter(
                pk=project["meta_project_id"],
            ).update(code=meta_code)


@transaction.atomic
def set_project_serial_numbers():
    """
    Set project serial numbers
    """
    logger.info("⏳ setting project serial numbers")
    set_serial_number()
    logger.info("✅ project serial numbers set")
    logger.info("⏳ setting project meta serial numbers")
    set_meta_serial_number()
    logger.info("✅ project serial meta numbers set")
