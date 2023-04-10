import logging
import pandas as pd

from django.db import transaction
from django.conf import settings

from core.models import Usage

logger = logging.getLogger(__name__)


@transaction.atomic
def parse_usage_file(file_path):
    """
    Import usages from file
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)
    If an usage parent can't be found in the database then the usage will not be imported

    @param file_path = str (file path for import file)
    """

    df = pd.read_excel(file_path).fillna("")
    for _, row in df.iterrows():
        parent = None
        if row["parent"]:
            parent = Usage.objects.get_by_name(row["parent"]).first()
            if not parent:
                logger.warning(
                    f"{row['parent']} usage not fount => {row['name']} not imported"
                )
        usage_data = {
            "name": row["name"],
            "full_name": row["full name"],
            "parent": parent,
        }
        Usage.objects.update_or_create(name=row["name"], defaults=usage_data)


def import_usages():
    file_path = settings.IMPORT_DATA_DIR / "usages.xlsx"
    parse_usage_file(file_path)
    logger.info("✔ usages imported")
