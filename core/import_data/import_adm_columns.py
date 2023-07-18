import json
import logging

from django.db import transaction

from core.import_data.utils import IMPORT_RESOURCES_DIR, delete_old_data
from core.models.adm import AdmColumn

logger = logging.getLogger(__name__)


@transaction.atomic
def parse_columns_file(file_path):
    """
    Import columns from json file

    @param file_path = str (file path for import file)
    """
    with open(file_path, encoding="utf8") as f:
        json_data = json.load(f)

    columns = []
    for column in json_data:
        column_data = {
            "source_file": file_path,
            **column,
        }
        columns.append(AdmColumn(**column_data))
    AdmColumn.objects.bulk_create(columns)


def import_adm_columns():
    file_path = IMPORT_RESOURCES_DIR / "adm_columns.json"
    delete_old_data(AdmColumn, file_path, logger)
    parse_columns_file(file_path)
    logger.info("✔ adm columns imported")
