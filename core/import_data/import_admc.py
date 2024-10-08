import json
import logging

from django.db import transaction
from django.conf import settings
from core.import_data.mapping_names_dict import CHEMICAL_NAME_MAPPING, DB_YEAR_MAPPING

from core.import_data.utils import (
    DB_DIR_LIST,
    get_adm_column,
    get_chemical_by_name_or_components,
    get_country_and_year_dict,
    get_cp_report_for_db_import,
    get_import_user,
    get_or_create_adm_row,
    is_imported_today,
)
from core.models.adm import AdmRecord, AdmRow
from core.models.country_programme import CPPrices, CPRecord

logger = logging.getLogger(__name__)

CP_COLUMNS_MAPPING = {
    "CumulativeAmount": "Cumulative float",
    "TrainedNumberHCFC": "HCFC float",
    "RecoveryAmountHCFC": "HCFC float",
    "RecoveryAmount": "ALL OTHER ODS float",
    "TrainedNumber": "ALL OTHER ODS float",
}

CP_RECORD_FIELDS_MAPPING = {
    "ExportAmount": "export_quotas",
    "ImportAmount": "import_quotas",
}

SECTION = "C"

ADM_RECORD_FIELDS = ["RecoveryAmount", "TrainedNumber"]
CP_RECORD_TITLE_WORDS = ["import quotas", "export quotas", "price"]


def get_columns_dict():
    """
    Get admC columns dict
    @param file_name = str (file path for import file) used for source_file field

    @return columns_dict = dict
        - struct: {
            field_name: AdmColumn object
        }
    """
    columns_dict = {}
    for field_name, column_name in CP_COLUMNS_MAPPING.items():
        column = get_adm_column(column_name, SECTION)
        if not column:
            return None
        columns_dict[field_name] = column

    return columns_dict


def create_adm_row(text, file_data, sort_order, parent_row=None):
    """
    Add adm row to items dict
    - if parent row set, the type will be QUESTION
    @param text = str (row text)
    @param source_data = dict (file data)
    @param sort_order = int (row sort order)
    @param parent_row = AdmRow object (admC parent row)

    @return AdmRow object
    """
    # if article parent id is set, get article id from articles dict

    row_data = {
        "text": text,
        "source_file": str(file_data["file_name"]),
        "sort_order": sort_order,
        "parent": parent_row,
        "section": SECTION,
        **DB_YEAR_MAPPING[file_data["db_name"]],
    }

    row_data["type"] = (
        AdmRow.AdmRowType.QUESTION
        if row_data.get("parent", None)
        else AdmRow.AdmRowType.TITLE
    )

    return get_or_create_adm_row(row_data)


def create_adm_rows_for_articles(file_data):
    """
    Parse admc_Layout json file and create adm rows for articles
    @param file_data = dict (file data)

    @return article_dict = dict
        - struct: {
            article_id: AdmRow object
        }

    """
    article_dict = {}
    with open(file_data["file_name"], "r", encoding="utf8") as f:
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
            file_data,
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
            chemical_name = CHEMICAL_NAME_MAPPING.get(chemical_name, chemical_name)
            chemical, chemical_type = get_chemical_by_name_or_components(
                chemical_name, item_json["ItemId"]
            )
            if not chemical:
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
    Update cp_report record for admC entry
    @param cp_report = CPReport object
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

    new_data = {}
    for entry_field, record_field in CP_RECORD_FIELDS_MAPPING.items():
        if admc_entry[entry_field]:
            new_data[record_field] = admc_entry[entry_field]

    if not new_data:
        # skip if there is no new data to be updated/ created
        return

    record_data.update(new_data)

    try:
        cp_record, created = CPRecord.objects.update_or_create(
            country_programme_report_id=cp.id,
            substance_id=record_data["substance_id"],
            blend_id=record_data["blend_id"],
            defaults=record_data,
        )
    except CPRecord.MultipleObjectsReturned:
        logger.warning(
            f"[row {admc_entry['Adm_CId']}]: Too many records for "
            f"{cp.name} substance: {record_data['substance_id']} blend:{record_data['blend_id']}"
        )
        return

    if created:
        cp_record.section = "A"
        cp_record.display_name = item["display_name"]
        cp_record.source_file = source_file
        cp_record.save()


def create_cp_price(cp, admc_entry, items_dict, source_file):
    """
    Create cp_report price for admC entry
    @param cp_report = CPReport object
    @param admc_entry = dict (admC entry)
    @param items_dict = dict (admC items dict)
    @param items_file = str (file path for items file) used for source_file field

    @return CPPrices object
    """

    item = items_dict[admc_entry["ItemId"]]
    price_data = {
        "country_programme_report": cp,
        "current_year_price": admc_entry["AvgODSPrice"],
        "display_name": item["display_name"],
        "source_file": source_file,
    }
    price_data["substance_id"] = item["value"] if item["type"] == "substance" else None
    price_data["blend_id"] = item["value"] if item["type"] == "blend" else None

    return CPPrices(**price_data)


def create_adm_record(cp, file_data, admc_entry, items_dict, column_dict):
    """
    Create adm record for admC entry
    @param cp_report = CPReport object
    @param file_data = dict (file data)
    @param admc_entry = dict (admC entry)
    @param items_dict = dict (admC items dict)
    @param column_dict = dict (admC columns dict)

    @return adm_records = list (adm records)
    """

    item = items_dict[admc_entry["ItemId"]]

    adm_row = create_adm_row(
        item["display_name"],
        file_data,
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
            "value_text": admc_entry[field],
            "section": SECTION,
            "source_file": file_data["file_name"],
        }
        adm_records.append(AdmRecord(**adm_record_data))

    return adm_records


def import_admc_entries(file_data, items_dict, column_dict):
    """
    Import admC entries from json file
    @param file_data = dict (file data)
    @param items_dict = dict (admC items dict)
    @param column_dict = dict (admC columns dict)
    """

    country_dict, year_dict = get_country_and_year_dict(file_data["dir_path"])

    with open(file_data["file_name"], "r", encoding="utf8") as f:
        json_data = json.load(f)

    admc_records = []
    prices = []
    system_user = get_import_user()
    for admc_entry in json_data:
        if admc_entry["ItemId"] not in items_dict:
            # chemical not found
            continue

        cp_report = get_cp_report_for_db_import(
            year_dict, country_dict, admc_entry, admc_entry["Adm_CId"]
        )

        if not cp_report:
            continue

        # We cannot update reports imported before today or created by a different user
        if not is_imported_today(cp_report, system_user):
            continue

        # update cp_record
        if items_dict[admc_entry["ItemId"]]["type"] == "text":
            admc_records.extend(
                create_adm_record(
                    cp_report, file_data, admc_entry, items_dict, column_dict
                )
            )
            continue

        udate_cp_record(cp_report, admc_entry, items_dict, file_data["file_name"])
        if admc_entry["AvgODSPrice"]:
            prices.append(
                create_cp_price(
                    cp_report, admc_entry, items_dict, file_data["file_name"]
                )
            )

    AdmRecord.objects.bulk_create(admc_records, batch_size=1000)
    CPPrices.objects.bulk_create(prices, batch_size=1000)


def parse_db_files(dir_path, db_name):
    """
    Parse db files and import data
    @param dir_path = str (directory path for import files)
    """

    admc_layout_file = f"{dir_path}/AdmCLayout.json"
    file_data = {
        "file_name": admc_layout_file,
        "db_name": db_name,
    }
    articles_dict = create_adm_rows_for_articles(file_data)

    items_dict = get_itmes_dict(f"{dir_path}/AdmCLayout.json", articles_dict)
    logger.info("✔ item file parsed")

    admc_file = f"{dir_path}/AdmC.json"
    column_dict = get_columns_dict()
    if not column_dict:
        return
    logger.info("✔ columns file parsed")

    file_data = {
        "file_name": admc_file,
        "dir_path": dir_path,
        "db_name": db_name,
    }
    import_admc_entries(
        file_data,
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
        parse_db_files(db_dir_path / database_name, database_name)
        logger.info(f"✔ admC records from {database_name} imported")
