import json
import logging

from django.db import transaction
from django.conf import settings

from core.import_data.utils import (
    DB_DIR_LIST,
    delete_old_data,
    get_chemical_by_name_or_components,
    get_country_and_year_dict,
    get_cp_report_for_db_import,
)
from core.models.adm import AdmColumn, AdmRecord, AdmRow
from core.models.country_programme import CountryProgrammePrices, CountryProgrammeRecord

logger = logging.getLogger(__name__)

CP_COLUMNS_MAPPING = {
    "CumulativeAmount": "Cumulative",
    "TrainedNumberHCFC": "HCFC",
    "RecoveryAmountHCFC": "HCFC",
    "RecoveryAmount": "All other ODS",
    "TrainedNumber": "All other ODS",
}

CP_RECORD_FIELDS_MAPPING = {
    "ExportAmount": "export_quotas",
    "ImportAmount": "import_quotas",
}

SECTION = "C"

ADM_RECORD_FIELDS = ["RecoveryAmount", "TrainedNumber"]
CP_RECORD_TITLE_WORDS = ["import quotas", "export quotas", "price"]


def import_columns(file_name):
    """
    Import adm columns for amdC using CP_COLUMNS_MAPPING
    @param file_name = str (file path for import file) used for source_file field

    @return columns_dict = dict
        - struct: {
            field_name: AdmColumn object
        }
    """
    columns_dict = {}
    for field_name, column_name in CP_COLUMNS_MAPPING.items():
        column_data = {
            "name": column_name,
            "source_file": file_name,
        }
        column, _ = AdmColumn.objects.get_or_create(
            name=column_name, defaults=column_data
        )
        columns_dict[field_name] = column

    return columns_dict


def create_adm_row(text, source_file, sort_order, parent_row=None):
    """
    Add adm row to items dict
    - if parent row set, the type will be QUESTION
    @param text = str (row text)
    @param source_file = str (file path for import file)
    @param sort_order = int (row sort order)
    @param parent_row = AdmRow object (admC parent row)

    @return AdmRow object
    """
    # if article parent id is set, get article id from articles dict

    row_data = {
        "text": text,
        "source_file": str(source_file),
        "sort_order": sort_order,
        "parent_row": parent_row,
    }

    row_data["type"] = (
        AdmRow.AdmRowType.QUESTION
        if row_data.get("parent_row", None)
        else AdmRow.AdmRowType.TITLE
    )

    # add adm row to items dict
    row, _ = AdmRow.objects.get_or_create(text=row_data["text"], defaults=row_data)

    return row


def create_adm_rows_for_articles(file_name):
    """
    Parse admc_Layout json file and create adm rows for articles
    @param file_name = str (file path for import file)

    @return article_dict = dict
        - struct: {
            article_id: AdmRow object
        }

    """
    article_dict = {}
    with open(file_name, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for item_json in json_data:
        # skip items that are not titles
        if not item_json["IsTitle"]:
            continue

        # skip articles that are substances titles
        chemical_title = False
        for word in CP_RECORD_TITLE_WORDS:
            if word in item_json["Label"].lower():
                chemical_title = True
        if chemical_title:
            continue

        item_json_id = item_json["ArticleId"]
        # if item is title, add it as adm row
        article_dict[item_json_id] = create_adm_row(
            item_json["Label"],
            file_name,
            item_json["SortOrder"],
        )

    return article_dict


def get_itmes_dict(file_name, articles_dict):
    """
    Parse items json file and create a dictionary
    - the items that are text will be inserted as adm rows

    @param file_name = str (file path for import file)
    @param articles_dict = dict (article dict)

    @return items_dict)
        - struct items_dict: {
            item_cp_id: {
                type: "blend" | "substance" | "text",
                value: chemical_id | item_text
                display_name: item_name
                field: field_name
                article: AdmRow object
            }
        }
    """
    items_dict = {}
    with open(file_name, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for item_json in json_data:
        # skip titles
        if item_json["IsTitle"]:
            continue

        item_json_id = item_json["ItemId"]

        if item_json["ArticleId"] not in articles_dict:
            # This Item is Chemical
            chemical_name = item_json["Label"].replace("(Optional)", "").strip()
            chemical, chemical_type = get_chemical_by_name_or_components(chemical_name)
            if not chemical:
                logger.warning(
                    f"Chemical not found: {chemical_name} "
                    f"(ItemId: {item_json['ItemId']})",
                )
                continue

            # add item to items dict
            items_dict[item_json_id] = {
                "display_name": item_json["Label"],
                "type": chemical_type,
                "value": chemical.id,
            }
            continue

        items_dict[item_json_id] = {
            "display_name": item_json["Label"],
            "type": "text",
            "value": item_json["Label"],
            "field_name": item_json["ItemField"],
            "article": articles_dict[item_json["ArticleId"]],
            "sort_order": item_json["SortOrder"],
        }

    return items_dict


def udate_cp_record(cp, admc_entry, items_dict, source_file):
    """
    Update cp record for admC entry
    @param cp = CountryProgrammeReport object
    @param admc_entry = dict (admC entry)
    @param items_dict = dict (admC items dict)
    @param items_file = str (file path for items file) used for source_file field
    """
    item = items_dict[admc_entry["ItemId"]]
    record_data = {
        "country_programme_report": cp,
    }

    # set substance_id or blend_id for cp_record
    record_data["substance_id"] = item["value"] if item["type"] == "substance" else None
    record_data["blend_id"] = item["value"] if item["type"] == "blend" else None

    for entry_field, record_field in CP_RECORD_FIELDS_MAPPING.items():
        if admc_entry[entry_field]:
            record_data[record_field] = admc_entry[entry_field]

    try:
        cp_record, created = CountryProgrammeRecord.objects.update_or_create(
            country_programme_report_id=cp.id,
            substance_id=record_data["substance_id"],
            blend_id=record_data["blend_id"],
            defaults=record_data,
        )
    except CountryProgrammeRecord.MultipleObjectsReturned:
        logger.warning(
            f"[row {admc_entry['Adm_CId']}]: Too many records for "
            f"{cp.name} substance: {record_data['substance_id']} blend:{record_data['blend_id']}"
        )
        return

    if created:
        cp_record.section = SECTION
        cp_record.display_name = item["display_name"]
        cp_record.source_file = source_file
        cp_record.save()


def create_cp_price(cp, admc_entry, items_dict, source_file):
    """
    Create cp price for admC entry
    @param cp = CountryProgrammeReport object
    @param admc_entry = dict (admC entry)
    @param items_dict = dict (admC items dict)
    @param items_file = str (file path for items file) used for source_file field

    @return CountryProgrammePrices object
    """

    item = items_dict[admc_entry["ItemId"]]
    price_data = {
        "country_programme_report": cp,
        "current_year_price": admc_entry["AvgODSPrice"],
        "current_year_text": str(admc_entry["AvgODSPrice"]),
        "display_name": item["display_name"],
        "source_file": source_file,
    }
    price_data["substance_id"] = item["value"] if item["type"] == "substance" else None
    price_data["blend_id"] = item["value"] if item["type"] == "blend" else None

    return CountryProgrammePrices(**price_data)


def create_adm_record(cp, file_name, admc_entry, items_dict, column_dict):
    """
    Create adm record for admC entry
    @param cp = CountryProgrammeReport object
    @param admc_entry = dict (admC entry)
    @param items_dict = dict (admC items dict)
    @param column_dict = dict (admC columns dict)

    @return adm_records = list (adm records)
    """

    item = items_dict[admc_entry["ItemId"]]

    adm_row = create_adm_row(
        item["display_name"],
        file_name,
        item["sort_order"],
        item["article"],
    )
    adm_records = []
    hcfc_field = item["field_name"] + "HCFC"
    for field in [item["field_name"], hcfc_field, "CumulativeAmount"]:
        if not admc_entry.get(field, None):
            continue
        adm_record_data = {
            "country_programme_report": cp,
            "row": adm_row,
            "column": column_dict[field],
            "value_float": admc_entry[field],
            "section": SECTION,
            "source_file": file_name,
        }
        adm_records.append(AdmRecord(**adm_record_data))

    return adm_records


def import_admc_entries(dir_path, file_name, items_dict, column_dict):
    """
    Import admC entries from json file
    @param dir_path = str (directory path for import files)
    @param file_name = str (file path for import file)
    @param items_dict = dict (admC items dict)
    @param column_dict = dict (admC columns dict)
    """

    country_dict, year_dict = get_country_and_year_dict(dir_path, logger)

    with open(file_name, "r", encoding="utf8") as f:
        json_data = json.load(f)

    admc_records = []
    prices = []
    for admc_entry in json_data:
        if admc_entry["ItemId"] not in items_dict:
            # chemical not found
            continue

        cp = get_cp_report_for_db_import(
            year_dict,
            country_dict,
            admc_entry,
            logger,
            admc_entry["Adm_CId"],
        )

        if not cp:
            continue

        # update cp_record
        if items_dict[admc_entry["ItemId"]]["type"] == "text":
            admc_records.extend(
                create_adm_record(cp, file_name, admc_entry, items_dict, column_dict)
            )
            continue

        udate_cp_record(cp, admc_entry, items_dict, file_name)
        if admc_entry["AvgODSPrice"]:
            prices.append(create_cp_price(cp, admc_entry, items_dict, file_name))

    AdmRecord.objects.bulk_create(admc_records)
    CountryProgrammePrices.objects.bulk_create(prices)


def parse_db_files(dir_path):
    """
    Parse db files and import data
    @param dir_path = str (directory path for import files)
    """

    admc_layout_file = f"{dir_path}/AdmCLayout.json"
    articles_dict = create_adm_rows_for_articles(admc_layout_file)

    items_dict = get_itmes_dict(f"{dir_path}/AdmCLayout.json", articles_dict)
    logger.info("✔ item file parsed")

    admc_file = f"{dir_path}/AdmC.json"
    column_dict = import_columns(admc_file)
    logger.info("✔ columns file parsed")

    delete_old_data(AdmRecord, admc_file, logger)
    delete_old_data(CountryProgrammePrices, admc_file, logger)
    import_admc_entries(
        dir_path,
        admc_file,
        items_dict,
        column_dict,
    )


@transaction.atomic
def import_admc_items():
    """
    Import records from databases
    """
    db_dir_path = settings.IMPORT_DATA_DIR / "databases"
    for database_name in DB_DIR_LIST:
        logger.info(f"⏳ importing admC records from {database_name}")
        parse_db_files(db_dir_path / database_name)
        logger.info(f"✔ admC records from {database_name} imported")
