import json
import logging

from django.db import transaction
from django.conf import settings
from core.import_data.mapping_names_dict import DB_YEAR_MAPPING, ADM_DE_MAPPING
from core.import_data.utils import (
    DB_DIR_LIST,
    get_country_and_year_dict,
    get_cp_report_for_db_import,
    get_or_create_adm_row,
)

from core.models.adm import AdmRecord, AdmChoice, AdmRow

logger = logging.getLogger(__name__)

SECTION = "D"

CHOICES_WITH_TEXT = {
    "1.": ["N/A"],
    "2.": ["Not so well"],
    "3.": ["Not so well"],
    "4.": ["Other:", "Acceleraded"],
}

CHOICE_LABLE_MAPPING = {
    "N/A": "If not, please specify milestones and completion dates with delays, "
    "and explain reasons for the delay and measures taken to overcome the problems:",
    "Not so well": "Please specify problems encountered:",
}


def create_adm_rows_for_articles(article_file, strings_file, layout_file, db_name):
    """
    Create AdmRow objects for each article in the article file.

    @param article_file: path to article file (used to get article id)
    @param strings_file: path to strings file (used to get article text)
    @param layout_file: path to layout file (used to get article sort order)

    @return: dictionary
    -structure: {article_id: AdmRow object}
    """

    # parse layout file
    article_order_dict = {}
    with open(layout_file, "r", encoding="utf8") as f:
        json_data = json.load(f)

    strings_json = []
    with open(strings_file, "r", encoding="utf8") as f:
        strings_json = json.load(f)
    stings_dict = {}
    for strin_data in strings_json:
        if strin_data["LanguageId"] == 1 and strin_data["ObjectType"] == 7:
            stings_dict[strin_data["ObjectId"]] = strin_data["StringText"].strip()

    for layout in json_data:
        article_order_dict[layout["AdmDEArticlesId"]] = layout["SortOrder"]

    # parse article file and create AdmRow objects
    article_dict = {}
    with open(article_file, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for article in json_data:
        article_id = article["AdmDEArticlesId"]
        row_data = {
            "text": stings_dict[article_id],
            "type": AdmRow.AdmRowType.QUESTION,
            "section": SECTION,
            "sort_order": article_order_dict[article_id],
            "source_file": article_file,
            **DB_YEAR_MAPPING[db_name],
        }
        article_dict[article_id] = get_or_create_adm_row(row_data)

    return article_dict


def create_adm_choices_for_opt(opt_file, strings_file, article_dict):
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

    strings_json = []
    with open(strings_file, "r", encoding="utf8") as f:
        strings_json = json.load(f)
    stings_dict = {}
    for strin_data in strings_json:
        if strin_data["LanguageId"] == 1 and strin_data["ObjectType"] == 9:
            initial_str = strin_data["LangDefault"] or strin_data["StringText"]
            if strin_data["StringText"] == "the 65% HCFC reduction target in 2025":
                initial_str = "the 65% HCFC reduction target in 2025"
            stings_dict[strin_data["ObjectId"]] = ADM_DE_MAPPING.get(
                initial_str, initial_str
            )

    for opt in json_data:
        adm_row = article_dict[opt["AdmDEArticlesId"]]
        option_data = {
            "value": stings_dict[opt["ArtOptId"]].strip(),
            "sort_order": opt["SortOrder"],
            "source_file": opt_file,
            "adm_row": adm_row,
        }
        # check if the option has a text field
        row_index = adm_row.text[:2]
        if row_index in CHOICES_WITH_TEXT:
            for word in CHOICES_WITH_TEXT[row_index]:
                if word in option_data["value"]:
                    option_data["with_text"] = True

        for word, text_lable in CHOICE_LABLE_MAPPING.items():
            if word in option_data["value"]:
                option_data["text_label"] = text_lable

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

    AdmRecord.objects.bulk_create(adm_records, batch_size=1000)


def parse_db_files(dir_path, db_name):
    """
    Parse all files in the directory.

    @param dir_path: path to directory
    """
    article_file = dir_path / "AdmDEArticles.json"
    layout_file = dir_path / "AdmDELayout.json"
    strings_file = dir_path / "Strings.json"
    article_dict = create_adm_rows_for_articles(
        article_file, strings_file, layout_file, db_name
    )
    logger.info(f"✔ {article_file} parsed, AdmRows imported")

    opt_file = dir_path / "AdmDEArticleOpts.json"
    opt_dict = create_adm_choices_for_opt(opt_file, strings_file, article_dict)
    logger.info(f"✔ {opt_file} parsed, AdmChoices imported")

    file_name = dir_path / "AdmDEArticleEntries.json"
    create_adm_records(file_name, dir_path, article_dict, opt_dict)


@transaction.atomic
def import_admde_items():
    """
    Import admDE records.
    """

    db_dir_path = settings.IMPORT_DATA_DIR / "databases"
    for database_name in DB_DIR_LIST:
        logger.info(f"⏳ importing admDE records from {database_name}")
        parse_db_files(db_dir_path / database_name, database_name)
        logger.info(f"✔ admDE records from {database_name} imported")
