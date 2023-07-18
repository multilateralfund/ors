import logging
import pandas as pd

from django.db import transaction
from core.import_data.utils import IMPORT_RESOURCES_DIR

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
            parent = Usage.objects.find_by_name(row["parent"])
            if not parent:
                logger.warning(
                    f"{row['parent']} usage not found => {row['name']} not imported"
                )
        usage_data = {
            "name": row["name"],
            "full_name": row["full name"],
            "sort_order": row["sort_order"],
            "parent": parent,
        }
        Usage.objects.update_or_create(full_name=row["full name"], defaults=usage_data)


def import_usages():
    file_path = IMPORT_RESOURCES_DIR / "usages.xlsx"
    parse_usage_file(file_path)
    logger.info("✔ usages imported")
