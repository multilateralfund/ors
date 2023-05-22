import logging
import pandas as pd

from django.db import transaction
from django.conf import settings
from core.import_data.utils import SUBSECTOR_CODE_MAPPING, SUBSECTOR_NAME_MAPPING
from core.models.project_sector import ProjectSector, ProjectSubSector


logger = logging.getLogger(__name__)

NEW_SUBSECTORS = [
    {
        "SEC": "OTH",
        "CODE_SUBSECTOR": "",
        "SUBSECTOR": "Policy paper",
    }
]


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
            "name": sector_name,
            "code": row["SEC"].strip(),
        }
        ProjectSector.objects.update_or_create(
            name=sector_data["name"], defaults=sector_data
        )


def parse_subsector_file(file_path):
    """
    Import sectors and subsectors from file
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)

    @param file_path = str (file path for import file)
    """

    df = pd.read_excel(file_path)

    # add other subsectors that are not in the file
    df_ext = pd.DataFrame(NEW_SUBSECTORS)
    df = pd.concat([df, df_ext], ignore_index=True)

    for _, row in df.iterrows():
        # get sector
        sector = ProjectSector.objects.filter(code=row["SEC"].strip()).first()
        if not sector:
            logger.warning(
                f"⚠️ {row['SEC']} sector not fount => {row['SUBSECTOR']} not imported"
            )
            continue
        # set subsector data
        subsector_name = row["SUBSECTOR"].strip()
        subsector_name = SUBSECTOR_NAME_MAPPING.get(subsector_name, subsector_name)
        subsector_code = (
            row["CODE_SUBSECTOR"].strip()
            if not pd.isna(row["CODE_SUBSECTOR"])
            else None
        )
        subsector_data = {
            "name": subsector_name,
            "code": subsector_code,
            "sector": sector,
        }
        #
        ProjectSubSector.objects.update_or_create(
            name=subsector_data["name"], defaults=subsector_data
        )


def import_project_sectors():
    file_path = settings.IMPORT_RESOURCES_DIR / "tbSector.xlsx"
    parse_sector_file(file_path)
    logger.info("✔ sectors imported")

    file_path = settings.IMPORT_RESOURCES_DIR / "tbSubsector.xlsx"
    parse_subsector_file(file_path)
    logger.info("✔ subsectors imported")
