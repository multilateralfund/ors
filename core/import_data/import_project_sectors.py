import logging
import pandas as pd

from django.db import transaction
from django.conf import settings

from core.models.project_sector import ProjectSector, ProjectSubSector

logger = logging.getLogger(__name__)


@transaction.atomic
def parse_sector_file(file_path):
    """
    Import sectors and subsectors from file
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)

    @param file_path = str (file path for import file)
    """

    df = pd.read_excel(file_path)
    for _, row in df.iterrows():
        sector, _ = ProjectSector.objects.get_or_create(name=row["sector"].strip())

        subsector_data = {
            "name": row["subsector"].strip(),
            "sector": sector,
        }
        ProjectSubSector.objects.update_or_create(
            name=subsector_data["name"], defaults=subsector_data
        )


def import_project_sectors():
    file_path = settings.IMPORT_RESOURCES_DIR / "sectors.xlsx"
    parse_sector_file(file_path)
    logger.info("✔ sectors and subsectors imported")
