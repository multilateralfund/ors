import logging
from decimal import Decimal

import pandas as pd
from django.db import transaction
from numpy import nan

from core.models import (
    DisputedContribution,
    ExternalIncomeAnnual,
    FermGainLoss,
    ScaleOfAssessment,
    ScaleOfAssessmentVersion,
)
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
INCOME_AMOUNT_Q1_COLUMN = 2
INCOME_AMOUNT_Q2_COLUMN = 3
INCOME_AMOUNT_Q3_COLUMN = 4
INCOME_AMOUNT_Q4_COLUMN = 5
INCOME_AMOUNT_COLUMN = 6

DISPUTED_COUNTRY_COLUMN = 0
DISPUTED_YEAR_COLUMN = 1
DISPUTED_AMOUNT_COLUMN = 2


def parse_ferm_sheet(ferm_df, countries):
    # Fetch the needed SoA versions to avoid lots of extra queries
    final_soa_versions_mapping = {
        version.replenishment.start_year: version
        for version in ScaleOfAssessmentVersion.objects.filter(is_final=True)
    }
    ferm_gains_losses = []
    scales_of_assessment = []
    for index, row in ferm_df.iterrows():
        # Skipping first row
        if index == 0:
            continue

        # There are two last rows; one empty, one with total. Not processing those.
        if row.iloc[FERM_COUNTRY_COLUMN] is None:
            continue
        country_name = row.iloc[FERM_COUNTRY_COLUMN].replace("\n", " ").strip()
        country = countries.get(COUNTRY_MAPPING.get(country_name, country_name))

        year = int(row.iloc[FERM_YEAR_COLUMN].strip())

        amount = get_decimal_from_excel_string(row.iloc[FERM_AMOUNT_COLUMN].strip())

        ferm_gains_losses.append(
            FermGainLoss(country=country, year=year, amount=amount)
        )

        # Also update the scales of assessments `opted_for_ferm` field if available
        # Assumes option is triennial (which also seems to be suggested by the data)
        if year in final_soa_versions_mapping:
            assessment = ScaleOfAssessment.objects.filter(
                version=final_soa_versions_mapping[year],
                country=country,
            ).first()
            if not assessment:
                continue
            if amount and amount != Decimal(0):
                assessment.opted_for_ferm = True
            elif assessment.qualifies_for_fixed_rate_mechanism:
                assessment.opted_for_ferm = False
            else:
                # not applicable
                assessment.opted_for_ferm = None
            scales_of_assessment.append(assessment)

    FermGainLoss.objects.bulk_create(ferm_gains_losses)
    logger.info(
        f"Imported {len(ferm_gains_losses)} FermGainLoss objects "
        f"from the consolidated data file."
    )

    ScaleOfAssessment.objects.bulk_update(scales_of_assessment, ["opted_for_ferm"])
    logger.info(
        f"Updated {len(scales_of_assessment)} objects with "
        f"`opted for FERM` information"
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

        quarterly_amounts_mapping = {
            "interest_earned_quarter_1": get_decimal_from_excel_string(
                row.iloc[INCOME_AMOUNT_Q1_COLUMN]
            ),
            "interest_earned_quarter_2": get_decimal_from_excel_string(
                row.iloc[INCOME_AMOUNT_Q2_COLUMN]
            ),
            "interest_earned_quarter_3": get_decimal_from_excel_string(
                row.iloc[INCOME_AMOUNT_Q3_COLUMN]
            ),
            "interest_earned_quarter_4": get_decimal_from_excel_string(
                row.iloc[INCOME_AMOUNT_Q4_COLUMN]
            ),
        }
        quarterly_params = {
            key: value
            for key, value in quarterly_amounts_mapping.items()
            if value is not None
        }

        external_incomes.append(
            ExternalIncomeAnnual(
                interest_earned=amount,
                agency_name=current_agency_name,
                year=year,
                **quarterly_params,
            )
        )

    ExternalIncomeAnnual.objects.bulk_create(external_incomes)
    logger.info(
        f"Imported {len(external_incomes)} ExternalIncomeAnnual objects "
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

    # This file only contains external income annual data; so only delete that one.
    delete_old_data(ExternalIncomeAnnual)

    # We have more granular per-country data in the consolidated file.
    delete_old_data(DisputedContribution)

    file_path = IMPORT_RESOURCES_DIR / "Consolidated_Financial_Data.xlsx"
    all_sheets = pd.read_excel(file_path, sheet_name=None, na_values="NDR", dtype=str)
    for sheet_name, df in all_sheets.items():
        logger.info(f"Start parsing sheet: {sheet_name}")
        parser_method = PARSE_MAPPING[sheet_name]
        parser_method(df.replace({nan: None}), countries)
