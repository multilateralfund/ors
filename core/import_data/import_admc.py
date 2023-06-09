import json
import logging

from django.db import transaction
from django.conf import settings

from core.import_data.utils import (
    DB_DIR_LIST,
    get_chemical_by_name_or_components,
    get_country_dict_from_db_file,
    get_year_dict_from_db_file,
)

logger = logging.getLogger(__name__)

CP_COLUMNS_MAPPING = {
    "ExportAmount": "value_float",
}


def get_itmes_dict(file_name):
    """
    Parse items json file and create a dictionary
    - the items that are text will be inserted as adm rows

    @param file_name = str (file path for import file)

    @return items_dict = dict
        - struct: {
            item_cp_id: {
                type: "blend" | "substance" | "text",
                value: item_id | item_text
                display_name: item_name
            }
        }
    """
    items_dict = {}
    with open(file_name, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for item_json in json_data:
        # get chemical by name
        chemical, chemical_type = get_chemical_by_name_or_components(item_json["Name"])
        if chemical:
            items_dict[item_json["ItemId"]] = {
                "type": chemical_type,
                "value": chemical.id,
                "display_name": item_json["Name"],
            }
            continue
        # if chemical not found, add as text
        items_dict[item_json["ItemId"]] = {
            "type": "text",
            "value": item_json["Name"],
            "display_name": item_json["Name"],
        }

    return items_dict


def parse_db_files(dir_path):
    """
    Parse db files and import data
    @param dir_path = str (directory path for import files)
    """
    country_dict = get_country_dict_from_db_file(f"{dir_path}/Country.json", logger)
    logger.info("✔ country file parsed " + str(len(country_dict)))

    year_dict = get_year_dict_from_db_file(f"{dir_path}/ProjectYear.json")
    logger.info("✔ year file parsed")

    items_dict = get_itmes_dict(dir_path / "Item.json")
    logger.info("✔ item file parsed")


@transaction.atomic
def import_admc_items():
    """
    Import records from databases
    """
    db_dir_path = settings.IMPORT_DATA_DIR / "databases"
    for database_name in DB_DIR_LIST:
        logger.info(f"⏳ importing admB records from {database_name}")
        parse_db_files(db_dir_path / database_name)
        logger.info(f"✔ admB records from {database_name} imported")
