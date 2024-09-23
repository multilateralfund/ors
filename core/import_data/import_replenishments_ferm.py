import decimal
import logging
from decimal import Decimal

import pandas as pd
from django.db import transaction
from numpy import nan

from core.models import FermGainLoss
from core.import_data.utils import (
    IMPORT_RESOURCES_DIR,
    delete_old_data,
    get_decimal_from_excel_string,
)

logger = logging.getLogger(__name__)

COUNTRY_MAPPING = {
    "Czech Republic": "Czechia",
    "Slovak Republic": "Slovakia",
    "Netherlands": "Netherlands (Kingdom of the)",
    "UK": "United Kingdom of Great Britain and Northern Ireland",
    "Russia": "Russian Federation",
    "SanMarino": "San Marino",
    "Solvenia": "Slovenia",
}

FERM_COUNTRY_COLUMN = 0
FERM_YEAR_COLUMN = 1
FERM_AMOUNT_COLUMN = 2


def parse_ferm_sheet(ferm_df, countries):
    ferm_gains_losses = []
    for index, row in ferm_df.iterrows():
        # Skipping first row
        if index == 0:
            continue

        # There are two last rows; one empty, one with total. Not processing those.
        if row.iloc[FERM_COUNTRY_COLUMN] is None:
            break
        country_name = row.iloc[FERM_COUNTRY_COLUMN].replace("\n", " ").strip()
        country = countries.get(COUNTRY_MAPPING.get(country_name, country_name))

        year = row.iloc[FERM_YEAR_COLUMN].strip()

        amount = get_decimal_from_excel_string(row.iloc[FERM_AMOUNT_COLUMN].strip())

        ferm_gains_losses.append(
            FermGainLoss(
                country=country,
                year=year,
                amount=amount
            )
        )

    FermGainLoss.objects.bulk_create(ferm_gains_losses)
    logger.info(f"Imported {len(ferm_gains_losses)} objects from the consolidated data file")


def parse_interest(interest_df, countries):
    pass

def parse_disputed_contributions(disputed_df, countries):
    pass


# Mapping of sheet_name -> parser_method
PARSE_MAPPING = {
    "FERM": parse_ferm_sheet,
    "Interest": parse_interest,
    "Disputed Contributions": parse_disputed_contributions,
}


@transaction.atomic
def import_ferm_interest_disputed(countries):
    """
    Import consolidated gain/loss, interest and disputed contributions data
    from the 19 September 2024 file from Owen.
    """
    # Deleting existing FermGainLoss as it's not granular
    delete_old_data(FermGainLoss)

    file_path = IMPORT_RESOURCES_DIR / "Consolidated_Financial_Data.xlsx"
    all_sheets = pd.read_excel(file_path, sheet_name=None, na_values="NDR", dtype=str)
    for sheet_name, df in all_sheets.items():
        logger.info(f"Start parsing sheet: {sheet_name}")
        parser_method = PARSE_MAPPING[sheet_name]
        parser_method(df.replace({nan: None}), countries)
