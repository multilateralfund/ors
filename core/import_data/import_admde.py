import json
import logging

from django.db import transaction
from django.conf import settings
from core.import_data.utils import (
    DB_DIR_LIST,
    DB_YEAR_MAPPING,
    delete_old_data,
    get_country_and_year_dict,
    get_cp_report_for_db_import,
    get_or_create_adm_row,
)

from core.models.adm import AdmRecord, AdmChoice, AdmRow

logger = logging.getLogger(__name__)

SECTION = "D"


def create_adm_rows_for_articles(article_file, layout_file, db_name):
    """
    Create AdmRow objects for each article in the article file.

    @param article_file: path to article file (used to get article text and id)
    @param layout_file: path to layout file (used to get article sort order)

    @return: dictionary
    -structure: {article_id: AdmRow object}
    """

    # parse layout file
    article_order_dict = {}
    with open(layout_file, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for layout in json_data:
        article_order_dict[layout["AdmDEArticlesId"]] = layout["SortOrder"]

    # parse article file and create AdmRow objects
    article_dict = {}
    with open(article_file, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for article in json_data:
        row_data = {
            "text": article["Name"].strip(),
            "type": AdmRow.AdmRowType.QUESTION,
            "section": SECTION,
            "sort_order": article_order_dict[article["AdmDEArticlesId"]],
            "source_file": article_file,
            **DB_YEAR_MAPPING[db_name],
        }
        article_dict[article["AdmDEArticlesId"]] = get_or_create_adm_row(row_data)

    return article_dict


def create_adm_choices_for_opt(opt_file, article_dict):
    """
    Create AdmChoice objects for each option in the options file.

    @param opt_file: path to options file

    @return: dictionary
        -structure: {
            (option_id, article_id): AdmChoice object
        }
    """

    opt_dict = {}
    with open(opt_file, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for opt in json_data:
        option_data = {
            "value": opt["OptionName"].strip(),
            "sort_order": opt["SortOrder"],
            "source_file": opt_file,
            "adm_row": article_dict[opt["AdmDEArticlesId"]],
        }

        dict_key = (opt["OptionId"], opt["AdmDEArticlesId"])
        opt_dict[dict_key], _ = AdmChoice.objects.get_or_create(
            value=option_data["value"],
            adm_row=option_data["adm_row"],
            defaults=option_data,
        )

    return opt_dict


def create_adm_records(file_name, dir_path, article_dict, opt_dict):
    """
    Create AdmRecord objects for each entry in the entries file.

    @param file_name: path to entries file
    @param dir_path: path to directory
    @param article_dict: dictionary of article_id: AdmRow object
    @param opt_dict: dictionary of (option_id, article_id): AdmChoice object
    """
    country_dict, year_dict = get_country_and_year_dict(dir_path)

    with open(file_name, "r", encoding="utf8") as f:
        json_data = json.load(f)

    adm_records = []
    for entry_json in json_data:
        # skip empty rows
        if not any([entry_json["Explanation"], entry_json["OptionValue"]]):
            continue

        cp = get_cp_report_for_db_import(
            year_dict, country_dict, entry_json, entry_json["AdmDEArtEntriesId"]
        )

        if not cp:
            continue

        # create AdmRecord object
        record_data = {
            "country_programme_report": cp,
            "row": article_dict[entry_json["AdmDEArticlesId"]],
            "value_text": entry_json["Explanation"],
            "source_file": file_name,
            "section": SECTION,
        }
        if entry_json["OptionValue"]:
            record_data["value_choice"] = opt_dict[
                (entry_json["OptionValue"], entry_json["AdmDEArticlesId"])
            ]
        adm_records.append(AdmRecord(**record_data))

    AdmRecord.objects.bulk_create(adm_records)


def parse_db_files(dir_path, db_name):
    """
    Parse all files in the directory.

    @param dir_path: path to directory
    """
    article_file = dir_path / "AdmDEArticles.json"
    layout_file = dir_path / "AdmDELayout.json"
    article_dict = create_adm_rows_for_articles(article_file, layout_file, db_name)
    logger.info(f"✔ {article_file} parsed, AdmRows imported")

    opt_file = dir_path / "AdmDEArticleOpts.json"
    opt_dict = create_adm_choices_for_opt(opt_file, article_dict)
    logger.info(f"✔ {opt_file} parsed, AdmChoices imported")

    file_name = dir_path / "AdmDEArticleEntries.json"
    delete_old_data(AdmRecord, file_name)
    create_adm_records(file_name, dir_path, article_dict, opt_dict)


@transaction.atomic
def import_admde_items():
    """
    Import admDE records.
    """
    # delete all admRows and admRecords
    AdmRow.objects.filter(
        source_file__contains="AdmDEArticles.json", section=SECTION
    ).delete()

    db_dir_path = settings.IMPORT_DATA_DIR / "databases"
    for database_name in DB_DIR_LIST:
        logger.info(f"⏳ importing admDE records from {database_name}")
        parse_db_files(db_dir_path / database_name, database_name)
        logger.info(f"✔ admDE records from {database_name} imported")
