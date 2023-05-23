import json
import logging

from django.db import transaction
from django.conf import settings
from core.import_data.utils import (
    COUNTRY_NAME_MAPPING,
    USAGE_NAME_MAPPING,
    delete_old_cp_records,
    get_blend_id_by_name,
    get_substance_id_by_name,
    get_cp_report,
)

from core.models import (
    Country,
    CountryProgrammeRecord,
    Usage,
)
from core.models.country_programme import CountryProgrammeUsage

logger = logging.getLogger(__name__)

DB_DIR_LIST = ["CP", "CP2012"]

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


def get_country_dict(file_name):
    """
    Parse country json file and create a dictionary
    @param file_name = str (file path for import file)

    @return country_dict = dict
        - struct: {
            country_cp_id: {
                "id": county_id,
                "name": country_name
            }
        }
    """
    country_dict = {}
    with open(file_name, "r") as f:
        json_data = json.load(f)

    for country_json in json_data:
        country_name = COUNTRY_NAME_MAPPING.get(
            country_json["Country"].strip(), country_json["Country"]
        )

        if "test" in country_name.lower() or "article 5" in country_name.lower():
            # set test countries to be skipped in the future
            country_dict[country_json["CountryId"]] = {
                "id": country.id,
                "name": "test",
            }
            continue

        country = Country.objects.get_by_name(country_name).first()
        if not country:
            logger.warning(
                f"Country not found: {country_json['Country']} "
                f"(CountryId: {country_json['CountryId']})",
            )
            continue

        country_dict[country_json["CountryId"]] = {
            "id": country.id,
            "name": country.name,
        }

    return country_dict


def get_year_dict(file_name):
    """
    Parse year json file and create a dictionary
    @param file_name = str (file path for import file)

    @return year_dict = dict
        - struct: {year_cp_id: year}
    """
    year_dict = {}
    with open(file_name, "r") as f:
        json_data = json.load(f)

    for year_json in json_data:
        year_dict[year_json["ProjectDateId"]] = year_json["ProjectDate"]

    return year_dict


def get_chemical_dict(file_name):
    """
    Parse chemical json file and create a dictionary
    @param file_name = str (file path for import file)

    @return chemical_dict = dict
        - struct: {
            chemical_cp_id: {
                type: "blend" | "substance",
                id: chemical_id
            }
        }
    """
    chemical_dict = {}
    with open(file_name, "r") as f:
        json_data = json.load(f)

    for chemical_json in json_data:
        # get substance_id if the item is substance
        substance_id = get_substance_id_by_name(chemical_json["Name"])
        if substance_id:
            chemical_dict[chemical_json["ItemId"]] = {
                "type": "substance",
                "id": substance_id,
            }
            continue

        # get blend_id if the item is blend
        blend_id = get_blend_id_by_name(chemical_json["Name"])
        if not blend_id:
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
            "id": blend_id,
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


def check_item_attributes(item, country_dict, year_dict, chemical_dict):
    """
    Check if item attributes are valid
    @param item = dict
    @param country_dict = dict
    @param year_dict = dict
    @param chemical_dict = dict

    @return is_valid = bool
    """
    if item["CountryId"] not in country_dict:
        logger.warning(
            f"Country not found: {item['CountryId']} "
            f"(ItemAttirbutesId: {item['ItemAttirbutesId']})"
        )
        return False
    if item["ProjectDateId"] not in year_dict:
        logger.warning(
            f"Year not found: {item['ProjectDateId']} "
            f"(ItemAttirbutesId: {item['ItemAttirbutesId']})"
        )
        return False
    if item["ItemId"] not in chemical_dict:
        logger.warning(
            f"Chemical not found: {item['ItemId']} "
            f"(ItemAttirbutesId: {item['ItemAttirbutesId']})"
        )
        return False
    return True


def parse_record_data(item_attributes_file, country_dict, year_dict, chemical_dict):
    with open(item_attributes_file, "r") as f:
        json_data = json.load(f)

    current_usages_dict = {}
    cp_usages = []
    for item in json_data:
        # skip for incorrect data
        if not check_item_attributes(item, country_dict, year_dict, chemical_dict):
            continue
        year = year_dict[item["ProjectDateId"]]
        country = country_dict[item["CountryId"]]

        # skip test country
        if country["name"] == "test":
            continue

        # get country programme report
        cp_rep = get_cp_report(
            year,
            country["name"],
            country["id"],
        )

        # get chemical
        substance_id = None
        blend_id = None
        if chemical_dict[item["ItemId"]]["type"] == "substance":
            substance_id = chemical_dict[item["ItemId"]]["id"]
        else:
            blend_id = chemical_dict[item["ItemId"]]["id"]

        # get usages
        set_usages_dict(current_usages_dict, item)

        # create record
        record_data = {
            "country_programme_report_id": cp_rep.id,
            "substance_id": substance_id,
            "blend_id": blend_id,
            "source_file": item_attributes_file,
            "imports": item["Import"],
            "exports": item["Export"],
            "production": item["Production"],
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
    country_dict = get_country_dict(f"{db_dir_path}/Country.json")
    logger.info("✔ country file parsed" + str(len(country_dict)))

    year_dict = get_year_dict(f"{db_dir_path}/ProjectYear.json")
    logger.info("✔ year file parsed")

    chemical_dict = get_chemical_dict(f"{db_dir_path}/Item.json")
    logger.info("✔ chemical file parsed" + str(len(chemical_dict)))

    item_attributes_file = f"{db_dir_path}/ItemAttributes.json"
    delete_old_cp_records(item_attributes_file, logger)
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
