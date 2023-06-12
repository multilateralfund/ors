import logging
import pandas as pd
import numpy as np
from django.db import transaction
from django.conf import settings

from core.import_data.utils import (
    get_cp_report,
    get_substance_by_name,
    get_blend_by_name_or_components,
    parse_chemical_name,
    get_country,
)
from core.models import CountryProgrammePrices

REQUIRED_COLUMNS = [
    "Country",
    "Controlled Substances",
]
REPORT_COLUMNS = [
    {
        "previous": "2019 Previous year price",
        "year": 2019,
        "remarks": "2019 Remarks",
    },
    {
        "previous": "2020 Previous year price",
        "year": 2020,
        "remarks": "2020 Remarks",
    },
    {
        "previous": "2021 Previous year price",
        "year": 2021,
        "remarks": "2021 Remarks",
    },
    {
        "previous": "2022 Previous year price",
        "year": 2022,
        "remarks": "2022 Remarks",
    },
]


logger = logging.getLogger(__name__)
FILE_NAME = "SectionC.xlsx"


def check_headers(df):
    for c in REQUIRED_COLUMNS:
        if c not in df.columns:
            logger.error("Invalid column list.")
            logger.warning(f"The following columns are required: {REQUIRED_COLUMNS}")
            return False
    return True


def get_chemical(chemical_name, index_row):
    """
    parse chemical name from row and return substance_id or blend_id:
        - if the chemical is a substance => return (substance_id, None)
        - if the chemical is a blend => return (None, blend_id)
        - if we can't find this chemical => return (None, None)
    @param chemical_name string
    @param index_row int

    @return tuple => (int, None) or (None, int) or (None, None)
    """

    chemical_search_name, components = parse_chemical_name(chemical_name)
    substance = get_substance_by_name(chemical_search_name)
    if substance:
        return substance, None

    blend = get_blend_by_name_or_components(chemical_search_name, components)
    if blend:
        return None, blend

    logger.warning(
        f"[row: {index_row}]: "
        f"This chemical does not exist: {chemical_name}, "
        f"Searched name: {chemical_search_name}, searched components: {components}"
    )
    return None, None


def parse_sheet(df):
    """
    parse the sheet and import the data in database
    @param df = pandas dataframe
    @param file_details = dict (file_name, session, convert_to_mt)
    """
    if not check_headers(df):
        logger.error("Couldn't parse this sheet")
        return

    current_country = {
        "name": None,
        "obj": None,
    }
    for index_row, row in df.iterrows():
        # another country => another country program
        if row["Country"] != current_country["name"]:
            current_country["name"] = row["Country"]
            current_country["obj"] = get_country(
                current_country["name"], index_row, logger
            )

        # we didn't found a country in db:
        if not current_country["obj"]:
            continue

        chemical_name = row["Controlled Substances"]
        if chemical_name == "HFC-365mfc (93%)/HFC-227ea (7%) - mezcla":
            continue
        substance, blend = get_chemical(chemical_name, index_row)
        if not substance and not blend:
            continue

        for report_details in REPORT_COLUMNS:
            cp_report = get_cp_report(
                report_details["year"],
                current_country["obj"].name,
                current_country["obj"].id,
            )

            try:
                previous_year_price = (
                    float(row[report_details["previous"]])
                    if row[report_details["previous"]]
                    else None
                )
                # some years are digits and some are strings
                current_year = report_details["year"]
                try:
                    current_year_text = row[current_year]
                    current_year_price = (
                        float(current_year_text) if current_year_text else None
                    )
                except KeyError:
                    current_year_text = row[str(current_year)]
                    current_year_price = (
                        float(current_year_text) if current_year_text else None
                    )
            # some price values are not decimals. skip them for now
            except ValueError:
                logger.warning(f"⚠️ [row: {index_row}] Price value is not a number  ")

            # create prices record
            record_data = {
                "country_programme_report_id": cp_report.id,
                "substance": substance,
                "blend": blend,
                "previous_year_price": previous_year_price,
                "previous_year_text": row[report_details["previous"]],
                "current_year_price": current_year_price,
                "current_year_text": current_year_text,
                "remarks": row[report_details["remarks"]],
                "display_name": chemical_name,
                "source_file": FILE_NAME,
            }

            CountryProgrammePrices.objects.create(**record_data)
    logger.info("✔ sheet parsed")


def parse_file(file_path):
    all_sheets = pd.read_excel(file_path, sheet_name=None)
    for sheet_name, df in all_sheets.items():
        if sheet_name.strip() == "Section C":
            df = df.replace(np.nan, None)
            parse_sheet(df)


@transaction.atomic
def import_records():
    file_path = settings.IMPORT_DATA_DIR / "records" / FILE_NAME
    CountryProgrammePrices.objects.all().delete()
    parse_file(file_path)
    logger.info(f"✔ records from {FILE_NAME} imported")
