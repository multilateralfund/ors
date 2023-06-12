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
from core.models.adm import AdmRow

logger = logging.getLogger(__name__)

CP_COLUMNS_MAPPING = {
    "CumulativeAmount": "Cumulative",
    "TrainedNumberHCFC": "HCFC",
    "RecoveryAmountHCFC": "HCFC",
}

SECTION = "C"

ADM_RECORD_FIELDS = ["RecoveryAmount", "TrainedNumber"]
CP_RECORD_TITLE_WORDS = ["import quotas", "export quotas", "price"]


def create_adm_row(row_data, articles_dict=None, article_parent_id=None):
    """
    Add adm row to items dict
    - if article parent id is set, get row parent from articles dict and add it as parent row
    @param row_data = dict (row data)
    @param articles_dict = dict (article dict)
    @param article_parent_id = int (article parent id)

    @return AdmRow object
    """
    if article_parent_id:
        # if article parent id is set, get article id from articles dict
        row_data.update(
            {
                "parent_row": articles_dict[article_parent_id],
                "type": AdmRow.AdmRowType.QUESTION,
            }
        )
    else:
        row_data["type"] = AdmRow.AdmRowType.TITLE

    # add adm row to items dict
    row, _ = AdmRow.objects.get_or_create(text=row_data["text"], defaults=row_data)

    return row


def get_itmes_dict(file_name):
    """
    Parse items json file and create a dictionary
    - the items that are text will be inserted as adm rows

    @param file_name = str (file path for import file)

    @return tuple (items_dict, article_dict)
        - struct items_dict: {
            item_cp_id: {
                type: "blend" | "substance" | "text",
                value: chemical_id | item_text
                display_name: item_name
                fields: {
                    field_name: article_id
            }
        }
        - struct article_dict: { article_id: AdmRow object }
    """
    items_dict = {}
    article_dict = {}
    with open(file_name, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for item_json in json_data:
        # skip items that will be parsed later for cp records / prices
        for word in CP_RECORD_TITLE_WORDS:
            if word in item_json["Label"].lower():
                continue

        item_json_id = item_json["ItemId"]
        # if item is title, add it as adm row
        if item_json["IsTitle"]:
            row_data = {
                "text": item_json["Label"],
                "cp_id": item_json_id,
                "source_file": str(file_name),
                "sort_order": item_json["SortOrder"],
            }
            article_dict[item_json_id] = create_adm_row(row_data)
            continue

        # if item is not in dict, add it
        if item_json_id not in items_dict:
            # check if item is chemical
            chemical, chemical_type = get_chemical_by_name_or_components(
                item_json["Label"]
            )
            # add item to items dict
            items_dict[item_json_id] = {
                "display_name": item_json["Label"],
                "type": chemical_type if chemical_type else "text",
                "value": chemical.id if chemical else item_json["Label"],
                "fields": {},
            }

        # add field to item
        field_name = item_json["ItemField"]
        hcfc_field_name = item_json["ItemField"] + "HCFC"
        if str(field_name).lower() in ADM_RECORD_FIELDS:
            items_dict[item_json_id]["fields"].update(
                {
                    field_name: item_json["ArticleId"],
                    hcfc_field_name: item_json["ArticleId"],
                }
            )

    return items_dict, article_dict


def parse_db_files(dir_path):
    """
    Parse db files and import data
    @param dir_path = str (directory path for import files)
    """
    country_dict = get_country_dict_from_db_file(f"{dir_path}/Country.json", logger)
    logger.info("✔ country file parsed " + str(len(country_dict)))

    year_dict = get_year_dict_from_db_file(f"{dir_path}/ProjectYear.json")
    logger.info("✔ year file parsed")

    items_dict, articles_dict = get_itmes_dict(dir_path / "Item.json")
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
