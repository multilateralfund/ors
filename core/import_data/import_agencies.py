import logging
import pandas as pd

from django.db import transaction
from django.conf import settings

from core.models.agency import Agency

logger = logging.getLogger(__name__)


@transaction.atomic
def parse_agency_file(file_path):
    """
    Import agency from file
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)

    @param file_path = str (file path for import file)
    """

    df = pd.read_excel(file_path)
    for _, row in df.iterrows():
        agency_data = {
            "name": row["Agency"].strip(),
        }
        Agency.objects.update_or_create(name=agency_data["name"], defaults=agency_data)


def import_agencies():
    file_path = settings.IMPORT_RESOURCES_DIR / "agencies.xlsx"
    parse_agency_file(file_path)
    logger.info("✔ agencies imported")
