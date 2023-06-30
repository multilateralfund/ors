import logging
import pandas as pd
import numpy as np
from django.db import transaction
from django.conf import settings

from core.import_data.utils import (
    check_headers,
    delete_old_data,
    get_cp_report,
    get_country_by_name,
    get_chemical,
    OFFSET,
    get_decimal_from_excel_string,
)
from core.models import CPPrices

REQUIRED_COLUMNS = [
    "Country",
    "Controlled Substances",
]
REPORT_COLUMNS = [
    {
        "previous": "2019 Previous year price",
        "year": "2019",
        "remarks": "2019 Remarks",
    },
    {
        "previous": "2020 Previous year price",
        "year": "2020",
        "remarks": "2020 Remarks",
    },
    {
        "previous": "2021 Previous year price",
        "year": "2021",
        "remarks": "2021 Remarks",
    },
    {
        "previous": "2022 Previous year price",
        "year": "2022",
        "remarks": "2022 Remarks",
    },
]


logger = logging.getLogger(__name__)
FILE_NAME = "SectionCDE.xlsx"


def create_cp_price(
    cp_report,
    substance,
    blend,
    chemical_name,
    prices_data,
):
    record_data = {
        "country_programme_report_id": cp_report.id,
        "substance": substance,
        "blend": blend,
        "display_name": chemical_name,
        "source_file": FILE_NAME,
        **prices_data,
    }
    return CPPrices.objects.create(**record_data)


def parse_sheet(df):
    """
    parse the sheet and import the data in database
    @param df = pandas dataframe
    """
    if not check_headers(df, REQUIRED_COLUMNS, logger):
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
            current_country["obj"] = get_country_by_name(
                current_country["name"], index_row, logger
            )

        # we didn't found a country in db:
        if not current_country["obj"]:
            continue

        chemical_name = row["Controlled Substances"]

        substance, blend = get_chemical(chemical_name, index_row, logger)
        if not substance and not blend:
            continue

        previous_year_prices_obj = None
        for report_details in REPORT_COLUMNS:
            # get previous year price
            previous_year_price = row[report_details["previous"]]
            decimal_price = get_decimal_from_excel_string(previous_year_price)
            if previous_year_price and decimal_price is None:
                logger.warning(
                    f"⚠️ [row: {index_row + OFFSET}][year: {report_details['year']}] "
                    f"Incorrect price value for previous year {previous_year_price}"
                )
            # get current year price
            current_year_price = row[report_details["year"]]
            decimal_price = get_decimal_from_excel_string(current_year_price)
            if current_year_price and decimal_price is None:
                logger.warning(
                    f"⚠️ [row: {index_row + OFFSET}][year: {report_details['year']}] "
                    f"Incorrect price value for current year {current_year_price}"
                )

            remarks = row[report_details["remarks"]]

            if not any(
                [
                    previous_year_price,
                    current_year_price,
                    remarks,
                ]
            ):
                # there is no data available for the current year.
                # set previous_year_prices_obj to None to avoid the case in the
                # next year has values that we can use for the curent year.
                previous_year_prices_obj = None
                continue

            cp_report = get_cp_report(
                int(report_details["year"]),
                current_country["obj"].name,
                current_country["obj"].id,
            )

            # create current year price
            prices_data = {
                "previous_year_price": previous_year_price,
                "current_year_price": current_year_price,
                "remarks": remarks,
            }
            current_year_price_obj = create_cp_price(
                cp_report,
                substance,
                blend,
                chemical_name,
                prices_data,
            )

            # if there is no previous year price data continue to the next year
            if not previous_year_price:
                previous_year_prices_obj = current_year_price_obj
                continue

            # using previous year price data from the current year
            # create previous year price object if it doesn't exist
            if not previous_year_prices_obj:
                previous_year_cp_report = get_cp_report(
                    int(report_details["year"]) - 1,
                    current_country["obj"].name,
                    current_country["obj"].id,
                )
                prices_data = {
                    "current_year_price": previous_year_price,
                }
                create_cp_price(
                    previous_year_cp_report,
                    substance,
                    blend,
                    chemical_name,
                    prices_data,
                )

                previous_year_prices_obj = current_year_price_obj
                continue

            # if the previous year price is not set, set it
            if not previous_year_prices_obj.current_year_price:
                previous_year_prices_obj.current_year_price = previous_year_price
                previous_year_prices_obj.save()

                previous_year_prices_obj = current_year_price_obj
                continue

            # if the previous year price is set,
            # check if it matches the current data about the previous year price
            if previous_year_prices_obj.current_year_price != previous_year_price:
                logger.warning(
                    f"⚠️  [row: {index_row + OFFSET}]"
                    f"[country: {current_country['obj'].name}][substance: {chemical_name}]"
                    f"[year: {report_details['year']}] Mismatch in price declaration."
                )

            # set the previous year price object to the current year price object
            previous_year_prices_obj = current_year_price_obj

    logger.info("✔ sheet parsed")


def parse_file(file_path):
    df = pd.read_excel(file_path, sheet_name="Section C", dtype=str)
    # replace nan with None
    df = df.replace(np.nan, None)
    # set column names to strings
    df.columns = df.columns.astype(str)
    parse_sheet(df)


@transaction.atomic
def import_records():
    file_path = settings.IMPORT_DATA_DIR / "records" / FILE_NAME

    logger.info(f"⏳ parsing file: {FILE_NAME}")
    # before we import anything, we should delete all prices from previous imports
    delete_old_data(CPPrices, FILE_NAME, logger)

    parse_file(file_path)
    logger.info(f"✔ section C records from {FILE_NAME} imported")
