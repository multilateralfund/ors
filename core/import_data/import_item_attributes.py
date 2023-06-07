import json
import logging

from django.db import transaction
from django.conf import settings
from core.import_data.utils import (
    DB_DIR_LIST,
    USAGE_NAME_MAPPING,
    check_empty_row,
    delete_old_data,
    get_blend_by_name,
    get_country_dict_from_db_file,
    get_cp_report_for_db_import,
    get_substance_by_name,
    get_year_dict_from_db_file,
)

from core.models import (
    CountryProgrammeRecord,
    Usage,
)
from core.models.country_programme import CountryProgrammeUsage

logger = logging.getLogger(__name__)

SECTION = "A"

NON_USAGE_FIELDS = {
    "ItemAttirbutesId",
    "ItemId",
    "CountryId",
    "Import",
    "Export",
    "Production",
    "ProjectDateId",
    "CreatedUserId",
    "UpdatedUserId",
    "DateCreated",
    "DateUpdated",
}


def get_chemical_dict(file_name):
    """
    Parse chemical json file and create a dictionary
    @param file_name = str (file path for import file)

    @return chemical_dict = dict
        - struct: {
            chemical_cp_id: {
                type: "blend" | "substance",
                id: chemical_id
                display_name: chemical_name
            }
        }
    """
    chemical_dict = {}
    with open(file_name, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for chemical_json in json_data:
        # get substance_id if the item is substance
        substance = get_substance_by_name(chemical_json["Name"])
        if substance:
            chemical_dict[chemical_json["ItemId"]] = {
                "type": "substance",
                "id": substance.id,
                "display_name": chemical_json["Name"],
            }
            continue

        # get blend_id if the item is blend
        blend = get_blend_by_name(chemical_json["Name"])
        if not blend:
            # if ItemCategoryId is not None, it means the item is for sure chemical
            # so we need to log it
            if chemical_json["ItemCategoryId"] is not None:
                logger.warning(
                    f"Chemical not found: {chemical_json['Name']} "
                    f"(ItemId: {chemical_json['ItemId']})",
                )
            # otherwise, it means that the item may not be a chemical
            continue

        chemical_dict[chemical_json["ItemId"]] = {
            "type": "blend",
            "id": blend.id,
            "display_name": chemical_json["Name"],
        }

    return chemical_dict


def set_usages_dict(current_usages_dict, item_attributes):
    """
    Parse item_attributes dict and update usages dictionary
    @param current_usages_dict = dict
        - struct: {usage_name: usage_id}
    @param item_attributes = dict
    """
    for usage_key in item_attributes:
        # skip non-usage fields
        if usage_key in NON_USAGE_FIELDS:
            continue

        usage_name = USAGE_NAME_MAPPING.get(usage_key, usage_key)
        if usage_name in current_usages_dict:
            continue

        usage = Usage.objects.get_by_name(usage_name).first()
        if not usage:
            logger.warning(
                f"This usage is not exists: {usage_key} "
                f"(ItemAttirbutesId: {item_attributes['ItemAttirbutesId']})"
            )
            continue

        current_usages_dict[usage_key] = usage.id


def parse_record_data(item_attributes_file, country_dict, year_dict, chemical_dict):
    with open(item_attributes_file, "r", encoding="utf8") as f:
        json_data = json.load(f)

    current_usages_dict = {}
    cp_usages = []
    for item in json_data:
        # check if chemical exists in dictionary
        if item["ItemId"] not in chemical_dict:
            logger.warning(
                f"Chemical not found: {item['ItemId']} "
                f"(EntryID: {item['ItemAttirbutesId']})"
            )
            continue

        # get country programme report
        cp_rep = get_cp_report_for_db_import(
            year_dict,
            country_dict,
            item,
            logger,
            item["ItemAttirbutesId"],
        )
        if not cp_rep:
            continue

        # get chemical
        substance_id = None
        blend_id = None
        if chemical_dict[item["ItemId"]]["type"] == "substance":
            substance_id = chemical_dict[item["ItemId"]]["id"]
        else:
            blend_id = chemical_dict[item["ItemId"]]["id"]

        # get usages
        set_usages_dict(current_usages_dict, item)
        quantity_columns = ["Import", "Export", "Production"] + list(
            current_usages_dict
        )
        # check if the row is empty
        if check_empty_row(item, item["ItemAttirbutesId"], quantity_columns, logger):
            continue

        # create record
        record_data = {
            "country_programme_report_id": cp_rep.id,
            "substance_id": substance_id,
            "blend_id": blend_id,
            "section": SECTION,
            "source_file": item_attributes_file,
            "imports": item["Import"],
            "exports": item["Export"],
            "production": item["Production"],
            "display_name": chemical_dict[item["ItemId"]]["display_name"],
        }
        record = CountryProgrammeRecord.objects.create(**record_data)

        # create records
        for usage, usage_id in current_usages_dict.items():
            if not item[usage]:
                continue
            cp_rep = {
                "country_programme_record_id": record.id,
                "usage_id": usage_id,
                "quantity": item[usage],
            }
            cp_usages.append(CountryProgrammeUsage(**cp_rep))

    CountryProgrammeUsage.objects.bulk_create(cp_usages)


def parse_db_files(db_dir_path):
    """
    Parse database files
    @param db_dir_path = str (directory path for database files)
    """
    country_dict = get_country_dict_from_db_file(f"{db_dir_path}/Country.json", logger)
    logger.info("✔ country file parsed" + str(len(country_dict)))

    year_dict = get_year_dict_from_db_file(f"{db_dir_path}/ProjectYear.json")
    logger.info("✔ year file parsed")

    chemical_dict = get_chemical_dict(f"{db_dir_path}/Item.json")
    logger.info("✔ chemical file parsed" + str(len(chemical_dict)))

    item_attributes_file = f"{db_dir_path}/ItemAttributes.json"
    delete_old_data(CountryProgrammeRecord, item_attributes_file, logger)
    parse_record_data(item_attributes_file, country_dict, year_dict, chemical_dict)
    logger.info(f"✔ records from {db_dir_path} imported")


@transaction.atomic
def import_records_from_databases():
    """
    Import records from databases
    """
    db_dir_path = settings.IMPORT_DATA_DIR / "databases"
    for dir_name in DB_DIR_LIST:
        parse_db_files(db_dir_path / dir_name)
