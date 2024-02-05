import logging

from django.db import transaction
from django.db.models import Min
from core.models.country import Country

from core.models.project import MetaProject, Project

logger = logging.getLogger(__name__)


def set_serial_number():
    """
    Set project serial numbers
    For each country:
    - order by meeting number and serial_number_legacy (asc)
    - set serial_number based on the order
    """

    countries = Country.objects.values_list("id", flat=True)
    for country_id in countries:
        projects = (
            Project.objects.select_related("approval_meeting")
            .filter(country_id=country_id)
            .order_by("approval_meeting__number", "serial_number_legacy")
        )
        for i, project in enumerate(projects):
            project.serial_number = i + 1
            project.save()


def set_meta_serial_number():
    """
    Set meta serial numbers for projects
    For each country and cluster (meta project) and meta project category (MYA / IND):
    - order by meeting number and serial_number_legacy (asc)
    - set serial_number based on the order and the pair country/cluster
    """
    countries = Country.objects.values_list("id", flat=True)
    for country_id in countries:
        projects = (
            Project.objects.select_related()
            .filter(
                country_id=country_id,
                meta_project__isnull=False,
            )
            .values("cluster_id", "meta_project_id")
            .annotate(min_serial_number=Min("serial_number"))
            .order_by("min_serial_number")
        )
        for i, project in enumerate(projects):
            Project.objects.select_related().filter(
                country_id=country_id,
                cluster_id=project["cluster_id"],
                meta_project_id=project["meta_project_id"],
            ).update(meta_serial_number=i + 1)


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
