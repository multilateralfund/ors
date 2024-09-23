import logging
from decimal import Decimal

import pandas as pd
from django.db import transaction
from numpy import nan

from core.models import Agency, DisputedContribution, ExternalIncome, FermGainLoss
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
    "United Kingdom": "United Kingdom of Great Britain and Northern Ireland",
    "Russia": "Russian Federation",
    "SanMarino": "San Marino",
    "Solvenia": "Slovenia",
}

FERM_COUNTRY_COLUMN = 0
FERM_YEAR_COLUMN = 1
FERM_AMOUNT_COLUMN = 2

INCOME_AGENCY_COLUMN = 0
INCOME_YEAR_COLUMN = 1
INCOME_AMOUNT_COLUMN = 6

DISPUTED_COUNTRY_COLUMN = 0
DISPUTED_YEAR_COLUMN = 1
DISPUTED_AMOUNT_COLUMN = 2


def migrate_old_income_data():
    is_inital_data = ExternalIncome.objects.filter(agency_name="").count() == 0
    logger.info(f"Is initial data: {is_inital_data}")
    if is_inital_data:
        # We need to *always* keep the initial objects containing miscellaneous_income,
        # at least until that is added to the consolidated financial data file. This is
        # now completely absent from the consolidated data file.
        # But we also need to avoid data duplication (2015-onwards) for interest_earned.

        # For years 1991-2014 we need to keep both miscellaneous and interest data.
        # For 2015- we need to set the interest earned to zero, but keep miscellaneous.
        ExternalIncome.objects.filter(start_year__gte=2015).update(
            interest_earned=Decimal(0)
        )
    else:
        # This is the updated data containing agency links.
        # We still need to keep the old data, but (hopefully) no more need to update it.
        # However, we delete all the newly-imported data that has set agencies.
        ExternalIncome.objects.exclude(agency_name="").delete()


def parse_ferm_sheet(ferm_df, countries):
    ferm_gains_losses = []
    for index, row in ferm_df.iterrows():
        # Skipping first row
        if index == 0:
            continue

        # There are two last rows; one empty, one with total. Not processing those.
        if row.iloc[FERM_COUNTRY_COLUMN] is None:
            continue
        country_name = row.iloc[FERM_COUNTRY_COLUMN].replace("\n", " ").strip()
        country = countries.get(COUNTRY_MAPPING.get(country_name, country_name))

        year = row.iloc[FERM_YEAR_COLUMN].strip()

        amount = get_decimal_from_excel_string(row.iloc[FERM_AMOUNT_COLUMN].strip())

        ferm_gains_losses.append(
            FermGainLoss(country=country, year=year, amount=amount)
        )

    FermGainLoss.objects.bulk_create(ferm_gains_losses)
    logger.info(
        f"Imported {len(ferm_gains_losses)} FermGainLoss objects "
        f"from the consolidated data file."
    )


def parse_interest(interest_df, countries):
    logger.debug(f"Number of countries: {len(countries)}")
    external_incomes = []
    current_agency_name = ""

    for index, row in interest_df.iterrows():
        # Skipping first row
        if index == 0:
            continue

        # Only importing the granular data in this iteration; need to stop here
        if row.iloc[INCOME_AGENCY_COLUMN] == "TOTAL INTEREST BY TRIENNIUM/YEAR":
            break

        if row.iloc[INCOME_AGENCY_COLUMN]:
            agency_name = row.iloc[INCOME_AGENCY_COLUMN].replace("\n", " ").strip()
            if agency_name:
                current_agency_name = agency_name

        year = row.iloc[INCOME_YEAR_COLUMN].strip()
        if "-" in year:
            # Skipping per-agency partial totals rows
            continue

        amount = get_decimal_from_excel_string(row.iloc[INCOME_AMOUNT_COLUMN].strip())

        external_incomes.append(
            ExternalIncome(
                interest_earned=amount,
                agency_name=current_agency_name,
                start_year=year,
                end_year=year,
            )
        )

    ExternalIncome.objects.bulk_create(external_incomes)
    logger.info(
        f"Imported {len(external_incomes)} ExternalIncome objects "
        f"from the consolidated data file."
    )


def parse_disputed_contributions(disputed_df, countries):
    disputed_contributions = []

    for index, row in disputed_df.iterrows():
        # Skipping first row
        if index == 0:
            continue

        # There are two last rows; one empty, one with total. Not processing those.
        if row.iloc[DISPUTED_COUNTRY_COLUMN] is None:
            continue
        country_name = row.iloc[DISPUTED_COUNTRY_COLUMN].replace("\n", " ").strip()
        country = countries.get(COUNTRY_MAPPING.get(country_name, country_name))

        year = row.iloc[DISPUTED_YEAR_COLUMN].strip()
        if "Subtotal" in year:
            # Skipping 91-96 subtotal row
            continue
        # This part of the data is simply not granular; assigning it to 1996
        if year == "1991-96":
            year = 1996

        amount = get_decimal_from_excel_string(row.iloc[DISPUTED_AMOUNT_COLUMN].strip())

        disputed_contributions.append(
            DisputedContribution(
                country=country,
                year=year,
                amount=amount,
            )
        )

    DisputedContribution.objects.bulk_create(disputed_contributions)
    logger.info(
        f"Imported {len(disputed_contributions)} DisputedContribution objects "
        f"from the consolidated data file."
    )


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
    # Deleting existing data as it's not granular.
    delete_old_data(FermGainLoss)

    # Partially keeping old ExternalIncome data as it contains useful
    # "miscellaneous_income" data.
    migrate_old_income_data()

    # We have more granular per-country data in the consolidated file.
    delete_old_data(DisputedContribution)

    file_path = IMPORT_RESOURCES_DIR / "Consolidated_Financial_Data.xlsx"
    all_sheets = pd.read_excel(file_path, sheet_name=None, na_values="NDR", dtype=str)
    for sheet_name, df in all_sheets.items():
        logger.info(f"Start parsing sheet: {sheet_name}")
        parser_method = PARSE_MAPPING[sheet_name]
        parser_method(df.replace({nan: None}), countries)
