import logging
import pandas as pd
import numpy as np
from django.db import transaction
from django.conf import settings

from core.import_data.utils import (
    get_cp_report,
    get_chemical_by_name_or_components,
    parse_chemical_name,
    get_country,
    OFFSET,
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
    chemical, chemical_type = get_chemical_by_name_or_components(
        chemical_search_name, components
    )

    if not chemical:
        logger.warning(
            f"[row: {index_row + OFFSET}]: "
            f"This chemical does not exist: {chemical_name}, "
            f"Searched name: {chemical_search_name}, searched components: {components}"
        )
        return None, None

    if chemical_type == "substance":
        return chemical, None

    return None, chemical


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

        # I dont know what to do with this.
        if chemical_name == "HFC-365mfc (93%)/HFC-227ea (7%) - mezcla":
            continue

        substance, blend = get_chemical(chemical_name, index_row)
        if not substance and not blend:
            continue

        previous_year_prices_obj = None
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
                logger.warning(
                    f"⚠️ [row: {index_row + OFFSET}] Price value is not a number."
                )

            # try to complete some missing data from previous year report
            if previous_year_price:
                if previous_year_prices_obj:
                    if previous_year_prices_obj.current_year_price:
                        if (
                            previous_year_prices_obj.current_year_price
                            != previous_year_price
                        ):
                            logger.warning(
                                f"⚠️  [row: {index_row + OFFSET}]"
                                f"[country: {current_country['obj'].name}][substance: {chemical_name}]"
                                f"[year: {report_details['year']}] Mismatch in price declaration."
                            )
                    else:
                        previous_year_prices_obj.current_year_price = (
                            previous_year_price
                        )
                        previous_year_prices_obj.save()
                else:
                    previous_year_cp_report = get_cp_report(
                        report_details["year"] - 1,
                        current_country["obj"].name,
                        current_country["obj"].id,
                    )
                    prev_record_data = {
                        "country_programme_report_id": previous_year_cp_report.id,
                        "substance": substance,
                        "blend": blend,
                        "previous_year_price": None,
                        "previous_year_text": "",
                        "current_year_price": previous_year_price,
                        "current_year_text": row[report_details["previous"]],
                        "remarks": "",
                        "display_name": chemical_name,
                        "source_file": FILE_NAME,
                    }
                    CountryProgrammePrices.objects.create(**prev_record_data)

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

            previous_year_prices_obj = CountryProgrammePrices.objects.create(
                **record_data
            )
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
