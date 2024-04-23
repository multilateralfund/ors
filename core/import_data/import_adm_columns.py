import json
import logging

from django.db import transaction

from core.import_data.utils import IMPORT_RESOURCES_DIR
from core.models.adm import AdmColumn
from core.models.time_frame import TimeFrame

logger = logging.getLogger(__name__)


@transaction.atomic
def parse_columns_file(file_path):
    """
    Import columns from json file

    @param file_path = str (file path for import file)
    """
    with open(file_path, encoding="utf8") as f:
        json_data = json.load(f)

    column_parents = {}
    for column_data in json_data:
        parent_name = column_data.pop("parent_name", None)
        if parent_name:
            column_data["parent"] = column_parents[parent_name]

        # get time frame
        min_year = column_data.pop("min_year", None)
        max_year = column_data.pop("max_year", None)
        time_frame = TimeFrame.objects.find_by_frame(min_year, max_year)

        column_data = {
            "source_file": file_path,
            "time_frame": time_frame,
            **column_data,
        }
        column = AdmColumn.objects.update_or_create(
            name=column_data["name"],
            section=column_data["section"],
            time_frame=time_frame,
            defaults=column_data,
        )[0]
        if not parent_name:
            column_parents[column.name] = column


def import_adm_columns():
    file_path = IMPORT_RESOURCES_DIR / "adm_columns.json"
    parse_columns_file(file_path)
    logger.info("✔ adm columns imported")
