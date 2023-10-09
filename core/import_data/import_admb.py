from dateutil import parser
import json
import logging

from django.db import transaction
from django.conf import settings
from core.import_data.utils import (
    DB_DIR_LIST,
    DB_YEAR_MAPPING,
    delete_old_data,
    get_adm_column,
    get_country_and_year_dict,
    get_cp_report_for_db_import,
    get_or_create_adm_row,
)

from core.models.adm import AdmColumn, AdmRecord, AdmRow

logger = logging.getLogger(__name__)

SECTION = "B"

CP_COLUMNS_MAPPING = {
    "CP": {
        "ALL OTHER ODS date": ["Date"],
        "ALL OTHER ODS text": ["Ongoing", "Amount"],
        "HCFC date": ["DateHCFC"],
        "HCFC text": ["OngoingHCFC", "Amount"],
        "CFC date": ["Date"],
        "CFC text": ["Ongoing"],
    },
    "CP2012": {
        "HCFC date": ["DateHCFC"],
        "HCFC text": ["OngoingHCFC"],
    },
}

ARTICLES_WITH_USER_TEXT = ["1.6.1", "1.6.2"]
ITEM_NOT_FOUND_IDS = [61]


def get_columns_dict(database_name):
    """
    Get columns dictionary
    @ param database_name = str (database name)

    @return columns_dict = dict
        - struct: {
            column_name: AdmColumn object
        }

    """

    columns_dict = {}
    for column_name in CP_COLUMNS_MAPPING[database_name]:
        column_obj = get_adm_column(column_name, SECTION)
        if not column_obj:
            return None
        columns_dict[column_name] = column_obj

    return columns_dict


def parse_strings_file(strings_file_name):
    """
    Import strings from json file
    ! these strings represents the text for admB rows

    @param strings_file_name = str (file path for import file)

    @return strings = dict
        - struct: {
            string_id: string_text
        }
    """
    with open(strings_file_name, "r", encoding="utf8") as f:
        strings_json = json.load(f)

    strings = {}
    for string_data in strings_json:
        if string_data["ObjectType"] == 1 and string_data["LanguageId"] == 1:
            strings[string_data["ObjectId"]] = string_data["StringText"]

    return strings


def get_parent_index(index):
    """
    Get parent index from index string
        e.g. "1.2.1" -> "1.2"
             "1.1" -> "1"
             "1" -> ""
    @param index = str (index)

    @return parent_index = str
    """
    parent_index = index.split(".")
    parent_index.pop()
    parent_index = ".".join(parent_index)

    return parent_index


def set_type(articles_dict):
    """
    Set type for each article
    ! we need type to create adm rows correctly
    @param articles_dict = dict (articles dictionary)
    """
    for index in articles_dict:
        parent_index = articles_dict[index]["parent_index"]
        # set type
        if parent_index and parent_index in articles_dict:
            # if the type is not set for the article, set it to question
            articles_dict[index]["type"] = articles_dict[index].get(
                "type", AdmRow.AdmRowType.QUESTION
            )
            # parent type should be subtitle or title
            if articles_dict[parent_index].get("type") == AdmRow.AdmRowType.QUESTION:
                articles_dict[parent_index]["type"] = AdmRow.AdmRowType.SUBTITLE
        else:
            # for top level articles set type to title
            articles_dict[index]["type"] = AdmRow.AdmRowType.TITLE


def parse_admb_file(file_name, strings_dict):
    """
    Parse admb json file and create a dictionary
      - based on strings dictionary we set the text for each article
      - if the article is not in strings dictionary, we add it to articles_without_text
    ! we need this dictionaries to create adm rows

    @param file_name = str (file path for import file)
    @param strings_dict = dict (strings dictionary)

    @return articles_dict, articles_without_text = tuple(dict, dict)
        - articles_dict struct: {
            index: {
                "text": admb_text,
                "sort_order": admb_sort_order,
                "internal_id": admb_cp_id,
                "parent_index": admb_parent_index,
                "index": admb_index,
                "section": B,
                "using_cfc": admb_using_cfc (bool)
            }
        }
        - articles_without_text struct: {
            ArticleId: {
                "type": AdmRow.AdmRowType.USER_TEXT,
                "sort_order": admb_sort_order,
                "internal_id": admb_cp_id,
                "parent_index": admb_parent_index
                "index": admb_index
            }
    """

    with open(file_name, "r", encoding="utf8") as f:
        articles_json = json.load(f)

    articles = {}
    articles_without_text = {}
    for article in articles_json:
        index = article["IndexId"].strip(".")
        article_data = {
            "sort_order": article["SortOrder"],
            "internal_id": article["Id"],
            "parent_index": get_parent_index(index),
            "source_file": file_name,
            "index": index,
            "section": SECTION,
        }
        if article["ArticleId"] in strings_dict:
            articles[index] = {
                "text": strings_dict[article["ArticleId"]].strip(),
                "using_cfc": index.startswith("1.3") or index.startswith("1.5"),
                **article_data,
            }
        else:
            articles_without_text[article["ArticleId"]] = {
                "type": AdmRow.AdmRowType.USER_TEXT,
                **article_data,
            }
            if index in ARTICLES_WITH_USER_TEXT:
                na_data = article_data.copy()
                na_data["sort_order"] = article_data["sort_order"] + 50
                articles[index] = {
                    "text": "N/A",
                    "using_cfc": False,
                    **na_data,
                }

    set_type(articles)

    return articles, articles_without_text


def parse_notes_file(file_name, articles_without_text):
    """
    Parse notes json file and create a dictionary
    ! we need notes only for articles without text for creating adm rows

    @param file_name = str (file path for import file)
    @param articles_without_text = dict (articles without text dictionary)

    @return notes = dict
        - struct: {
            (ArticleId, CountryId, ProjectDateId): note_text,
        }
    """
    with open(file_name, "r", encoding="utf8") as f:
        notes_json = json.load(f)

    notes = {}
    for note in notes_json:
        # skip notes of other types
        if note["ObjectType"] != 1 or note["ObjectId"] not in articles_without_text:
            continue

        notes[(note["ObjectId"], note["CountryId"], note["ProjectDateId"])] = note[
            "Comment"
        ].strip()

    return notes


def create_row(index, articles_dict, adm_rows, db_name):
    """
    Recursively create adm row for each article with text

    @param index = str (index)
    @param articles_dict = dict (articles dictionary)
    @param adm_rows = dict
        - struct: {
            adm_id: {
                "object": ADMRow object,
                "using_cfc": using_cfc (bool)
            }
        }
    @param db_name = str (database name)
    """
    # skip if adm row is already created
    if index in adm_rows:
        return

    adm_row_data = articles_dict[index].copy()
    adm_row_data["parent"] = None
    parent_index = adm_row_data.pop("parent_index")
    using_cfc = adm_row_data.pop("using_cfc")
    internal_id = adm_row_data.pop("internal_id")

    # add min/ max year
    adm_row_data.update(DB_YEAR_MAPPING[db_name])

    adm_row = get_or_create_adm_row(adm_row_data)
    adm_rows[internal_id] = {
        "object": adm_row,
        "using_cfc": using_cfc,
    }

    if adm_row_data["type"] != AdmRow.AdmRowType.TITLE:
        create_row(parent_index, articles_dict, adm_rows, db_name)
        parent_id = articles_dict[parent_index]["internal_id"]
        adm_row.parent = adm_rows[parent_id]["object"]
        adm_row.save()
    else:
        adm_row.parent = None
        adm_row.save()


def import_strings(articles_dict, db_name):
    """
    Create adm rows from articles dictionary
    @param articles_dict = dict (articles dictionary)
    @param db_name = str (database name)

    @return admb = dict
        - struct: {
            adm_id: ADMRow object
        }
    """
    adm_rows = {}

    for index in articles_dict:
        create_row(index, articles_dict, adm_rows, db_name)

    return adm_rows


def create_row_from_notes(
    admb_entry, articles_without_text, notes, db_name, cp_report_id
):
    """
    Create adm row from notes
    ! we use notes to create adm rows for articles without text

    @param admb_entry = dict
    @param articles_without_text = dict (articles without text dictionary)
    @param notes = dict (notes dictionary)
    @param db_name = str (database name)
    @param cp_report_id = int (country programme report id)

    @return adm_row = AdmRow object
    """
    note_key = (
        admb_entry["Adm_B_Id"],
        admb_entry["CountryId"],
        admb_entry["ProjectDateId"],
    )
    # get text from notes or entry label
    text = None
    if note_key in notes:
        text = notes[note_key]
    elif admb_entry["Label"]:
        text = admb_entry["Label"].strip()
    if not text:
        return None

    adm_row_data = {
        "text": text,
        "country_programme_report_id": cp_report_id,
        **DB_YEAR_MAPPING[db_name],
        **articles_without_text[admb_entry["Adm_B_Id"]],
    }
    adm_row_data.pop("internal_id")

    parent_index = adm_row_data.pop("parent_index")
    adm_row_data["parent"] = AdmRow.objects.filter(index=parent_index).first()
    adm_row = get_or_create_adm_row(adm_row_data)
    return adm_row


def import_adm_records(
    file_data,
    adm_rows,
    articles_without_text,
    notes,
):
    """
    Import admB records from json file

    @param file_data = dict
    @param adm_rows = dict
    @param articles_without_text = dict
    @param notes = dict

    """
    country_dict, year_dict = get_country_and_year_dict(file_data["dir_path"])
    columns_dict = get_columns_dict(file_data["database_name"])
    if not columns_dict:
        return

    with open(file_data["admb_entries_file"], "r", encoding="utf8") as f:
        admb_entries_json = json.load(f)

    adm_records = []
    for admb_entry in admb_entries_json:
        # get cp report
        cp_report = get_cp_report_for_db_import(
            year_dict, country_dict, admb_entry, admb_entry["AdmbEntriesId"]
        )
        if not cp_report:
            continue

        # get or create adm row
        adm_row = None
        is_using_cfc = False
        if admb_entry["Adm_B_Id"] in ITEM_NOT_FOUND_IDS:
            continue

        if admb_entry["Adm_B_Id"] in adm_rows:
            # get adm row from adm rows
            adm_row = adm_rows[admb_entry["Adm_B_Id"]]["object"]
            is_using_cfc = adm_rows[admb_entry["Adm_B_Id"]]["using_cfc"]

        if not adm_row or adm_row.text == "N/A":
            # create adm row from notes for articles without text
            row_from_notes = create_row_from_notes(
                admb_entry,
                articles_without_text,
                notes,
                db_name=file_data["database_name"],
                cp_report_id=cp_report.id,
            )
            adm_row = row_from_notes if row_from_notes else adm_row

        if not adm_row:
            logger.warning(
                f"[row:{admb_entry['AdmbEntriesId']}]: "
                f"⚠️ adm row not found for article: {admb_entry['Adm_B_Id']}"
            )
            continue

        # create adm records for each column
        for column_name, json_attributes in CP_COLUMNS_MAPPING[
            file_data["database_name"]
        ].items():
            # skip cfc columns if it's not using cfc
            if not is_using_cfc and column_name.startswith("CFC"):
                continue
            # skip ods columns if it's using cfc
            if is_using_cfc and "ODS" in column_name:
                continue
            column_obj = columns_dict[column_name]

            # get column attributes
            adm_record_data = {}
            for json_attribute in json_attributes:
                if admb_entry[json_attribute] is None:
                    continue
                if column_obj.type == AdmColumn.AdmColumnType.DATE:
                    adm_record_data["value_text"] = parser.parse(
                        admb_entry[json_attribute]
                    ).strftime("%m/%d/%Y")
                elif column_obj.type == AdmColumn.AdmColumnType.TEXT:
                    if "ongoing" in json_attribute.lower():
                        # 1 = Yes, 2 = No
                        adm_record_data["value_text"] = (
                            "Yes" if admb_entry[json_attribute] == 1 else "No"
                        )
                    else:
                        adm_record_data["value_text"] = admb_entry[json_attribute]

            # insert only if there is data for the column
            if not adm_record_data:
                continue

            if adm_row.text == "N/A" and "value_text" not in adm_record_data:
                # skip adm records for articles without text if there is no value
                continue

            adm_record_data.update(
                {
                    "country_programme_report": cp_report,
                    "row": adm_row,
                    "column": column_obj,
                    "section": SECTION,
                    "source_file": file_data["admb_entries_file"],
                }
            )
            adm_records.append(AdmRecord(**adm_record_data))

    AdmRecord.objects.bulk_create(adm_records, batch_size=1000)


def parse_db_files(dir_path, database_name):
    """
    Import records from db files
    @param dir_path = str (directory path for import files)
    """

    strings_file_name = dir_path / "Strings.json"
    strings_dict = parse_strings_file(strings_file_name)
    logger.info("✔ strings file parsed")

    admb_file_name = dir_path / "Adm_B.json"
    articles_dict, articles_without_text = parse_admb_file(admb_file_name, strings_dict)
    logger.info("✔ admb file parsed")

    if articles_without_text:
        notes = parse_notes_file(dir_path / "Notes.json", articles_without_text)
        logger.info(
            f"✔ notes file parsed, needed notes for articles: {articles_without_text.keys()}"
        )

    adm_rows = import_strings(articles_dict, database_name)
    logger.info("✔ adm rows imported")

    admb_entries_file = dir_path / "AdmB_Entries.json"
    delete_old_data(AdmRecord, admb_entries_file)
    file_data = {
        "admb_entries_file": admb_entries_file,
        "database_name": database_name,
        "dir_path": dir_path,
    }
    import_adm_records(
        file_data,
        adm_rows,
        articles_without_text,
        notes,
    )
    logger.info("✔ admB records imported")


@transaction.atomic
def import_admb_items():
    """
    Import records from databases
    """
    # delete all admRows and admRecords
    AdmRow.objects.filter(source_file__contains="Adm_B.json", section=SECTION).delete()

    db_dir_path = settings.IMPORT_DATA_DIR / "databases"
    for database_name in DB_DIR_LIST:
        logger.info(f"⏳ importing admB records from {database_name}")
        parse_db_files(db_dir_path / database_name, database_name)
        logger.info(f"✔ admB records from {database_name} imported")
