import logging

from django.db import transaction

from core.models import (
    BPChemicalType,
    ProjectCluster,
    ProjectType,
    ProjectSector,
    ProjectSubSector,
)

logger = logging.getLogger(__name__)


@transaction.atomic
def import_bp_other_objects():
    BPChemicalType.objects.get_or_create(name="Other")
    ProjectCluster.objects.get_or_create(name="Other", code="OTH")
    ProjectType.objects.get_or_create(name="Other", code="OTH")
    sector_other, _ = ProjectSector.objects.get_or_create(name="Other", code="OTH")
    for sector in ProjectSector.objects.exclude(id=sector_other.id):
        ProjectSubSector.objects.get_or_create(
            name=f"Other {sector.name}", sector=sector, code=f"OTH{sector.code}"
        )
    ProjectSubSector.objects.get_or_create(name="Other", sector=sector_other, code="OTH")

    logger.info("✔ BP 'Other' objects imported")
