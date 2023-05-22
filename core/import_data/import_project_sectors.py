import logging
import pandas as pd

from django.db import transaction
from django.conf import settings
from core.import_data.utils import USAGE_NAME_MAPPING

from core.models.usage import Usage

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
        sector_name = row["SECTOR"].strip()
        sector_data = {
            "name": USAGE_NAME_MAPPING.get(sector_name, sector_name),
            "code": row["SEC"].strip(),
        }
        Usage.objects.update_or_create(name=sector_data["name"], defaults=sector_data)


def parse_subsector_file(file_path):
    """
    Import sectors and subsectors from file
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)

    @param file_path = str (file path for import file)
    """

    df = pd.read_excel(file_path)
    for _, row in df.iterrows():
        sector = Usage.objects.filter(code=row["SEC"]).first()
        if not sector:
            logger.warning(
                f"⚠️ {row['SEC']} sector not fount => {row['SUBSECTOR']} not imported"
            )
            continue
        subsector_data = {
            "name": row["SUBSECTOR"].strip(),
            "code": str(row["CODE_SUBSECTOR"]).strip(),
            "parent": sector,
        }
        Usage.objects.update_or_create(
            name=subsector_data["name"], defaults=subsector_data
        )


def import_project_sectors():
    file_path = settings.IMPORT_RESOURCES_DIR / "tbSector.xlsx"
    parse_sector_file(file_path)
    logger.info("✔ sectors imported")

    file_path = settings.IMPORT_RESOURCES_DIR / "tbSubsector.xlsx"
    parse_subsector_file(file_path)
    logger.info("✔ subsectors imported")
