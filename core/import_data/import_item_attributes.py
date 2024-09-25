import json
import logging
from dateutil import parser

from django.db import transaction
from django.conf import settings
from core.import_data.mapping_names_dict import (
    CHEMICAL_NAME_MAPPING,
    USAGE_NAME_MAPPING,
)
from core.import_data.utils import (
    DB_DIR_LIST,
    check_empty_row,
    create_cp_record,
    get_chemical_by_name_or_components,
    get_country_dict_from_db_file,
    get_cp_report_for_db_import,
    get_import_user,
    get_year_dict_from_db_file,
    is_imported_today,
)

from core.models import Usage
from core.models.country_programme import CPUsage

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
        # get chemical by name
        chemical_name = CHEMICAL_NAME_MAPPING.get(
            chemical_json["Name"], chemical_json["Name"]
        )
        chemical, chemical_type = get_chemical_by_name_or_components(chemical_name)
        if not chemical:
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
            "type": chemical_type,
            "id": chemical.id,
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

        usage = Usage.objects.find_by_name(usage_name)
        if not usage:
            logger.warning(
                f"This usage is not exists: {usage_key} "
                f"(ItemAttirbutesId: {item_attributes['ItemAttirbutesId']})"
            )
            continue

        current_usages_dict[usage_key] = usage


def get_users_dict(users_file):
    """
    Parse users json file and create a dictionary
    @param users_file = str (file path for import file)

    @return users_dict = dict
        - struct: {
            user_id: {
                user_name: user_name,
                uset_email: user_email
            }
        }
    """
    users_dict = {}
    with open(users_file, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for user_json in json_data:
        user_name = f"{user_json['FName']} {user_json['LName']}"
        users_dict[user_json["UserID"]] = {
            "reporting_entry": user_name.strip(),
            "reporting_email": user_json["Email"],
        }

    return users_dict


def parse_record_data(
    item_attributes_file, country_dict, year_dict, chemical_dict, users_dict
):
    """
    Parse item_attributes json file and import the data in database
    @param item_attributes_file = str (file path for import file)
    @param country_dict = dict
    @param year_dict = dict
    @param chemical_dict = dict
    @param users_dict = dict
    """

    with open(item_attributes_file, "r", encoding="utf8") as f:
        json_data = json.load(f)

    current_usages_dict = {}
    cp_usages = []
    system_user = get_import_user()

    for item in json_data:
        # check if chemical exists in dictionary
        if item["ItemId"] not in chemical_dict:
            logger.warning(
                f"Chemical not found: {item['ItemId']} "
                f"(EntryID: {item['ItemAttirbutesId']})"
            )
            continue

        cp_rep_data = {
            "submission_date": parser.parse(item["DateCreated"]),
            **users_dict[item["CreatedUserId"]],
        }

        # get country programme report
        cp_rep = get_cp_report_for_db_import(
            year_dict, country_dict, item, item["ItemAttirbutesId"], cp_rep_data
        )
        if not cp_rep:
            continue

        # We cannot update reports imported before today or created by a different user
        if not is_imported_today(cp_rep, system_user):
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
        if check_empty_row(item, item["ItemAttirbutesId"], quantity_columns):
            continue

        # set record data
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

        # set usage data
        usages_data = []
        for usage_key, usage_obj in current_usages_dict.items():
            if not item[usage_key]:
                continue
            usages_data.append(
                {
                    "usage": usage_obj,
                    "quantity": item[usage_key],
                }
            )

        cp_usages.extend(
            create_cp_record(record_data, usages_data, item["ItemAttirbutesId"])
        )

    CPUsage.objects.bulk_create(cp_usages, batch_size=1000)


def parse_db_files(db_dir_path):
    """
    Parse database files
    @param db_dir_path = str (directory path for database files)
    """
    country_dict = get_country_dict_from_db_file(f"{db_dir_path}/Country.json")
    logger.info("✔ country file parsed")

    year_dict = get_year_dict_from_db_file(f"{db_dir_path}/ProjectYear.json")
    logger.info("✔ year file parsed")

    chemical_dict = get_chemical_dict(f"{db_dir_path}/Item.json")
    logger.info("✔ chemical file parsed")

    users_dict = get_users_dict(f"{db_dir_path}/Users.json")
    logger.info("✔ users file parsed")

    item_attributes_file = f"{db_dir_path}/ItemAttributes.json"
    parse_record_data(
        item_attributes_file, country_dict, year_dict, chemical_dict, users_dict
    )
    logger.info(f"✔ records from {db_dir_path} imported")


@transaction.atomic
def import_records_from_databases():
    """
    Import records from databases
    """
    db_dir_path = settings.IMPORT_DATA_DIR / "databases"
    for dir_name in DB_DIR_LIST:
        logger.info(f"⏳ importing records from {dir_name}")
        parse_db_files(db_dir_path / dir_name)
