# TODO: split into more functions
# pylint: disable=R0915,R0914

import decimal
import logging

import pandas as pd
from django.db import transaction

from core.import_data.utils import IMPORT_RESOURCES_DIR, delete_old_data
from core.models import (
    AnnualContributionStatus,
    DisputedContribution,
    FermGainLoss,
    TriennialContributionStatus,
    ExternalIncome,
    ExternalAllocation,
    CountryCEITStatus,
)


logger = logging.getLogger(__name__)

COUNTRY_MAPPING = {
    "Czech Republic": "Czechia",
    "Slovak Republic": "Slovakia",
    "Netherlands": "Netherlands (Kingdom of the)",
    "United Kingdom": "United Kingdom of Great Britain and Northern Ireland",
}

# Indices are 1-based like in Excel for easier comparison
ANNUAL_STATUS_OF_CONTRIBUTIONS_SHEET_INFO = {
    1991: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 58,
    },
    1992: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 58,
    },
    1993: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 58,
    },
    1994: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 58,
    },
    1995: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 58,
    },
    1996: {
        "cols": "A:G",
        "start_row": 7,
        "end_row": 58,
        "disputed_contributions": {
            "col": "F",
            "row": 59,
        },
    },
    1997: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 58,
    },
    1998: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 58,
    },
    1999: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 58,
    },
    2000: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 49,
    },
    2001: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 50,
    },
    2002: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 50,
    },
    2003: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 50,
    },
    2004: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 50,
    },
    2005: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 50,
    },
    2006: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 52,
    },
    2007: {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 52,
        "disputed_contributions": {
            "col": "B",
            "row": 54,
        },
    },
    2008: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 53,
        "disputed_contributions": {
            "col": "B",
            "row": 55,
        },
    },
    2009: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 55,
    },
    2010: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 55,
        "disputed_contributions": {
            "col": "B",
            "row": 57,
        },
    },
    2011: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 55,
    },
    2012: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
        "disputed_contributions": {
            "col": "B",
            "row": 59,
        },
    },
    2013: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
        "disputed_contributions": {
            "col": "B",
            "row": 59,
        },
    },
    2014: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
        "disputed_contributions": {
            "col": "B",
            "row": 59,
        },
    },
    2015: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
        "disputed_contributions": {
            "col": "B",
            "row": 59,
        },
    },
    2016: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
        "disputed_contributions": {
            "col": "B",
            "row": 59,
        },
    },
    2017: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
    2018: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
        "disputed_contributions": {
            "col": "B",
            "row": 59,
        },
    },
    2019: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
        "disputed_contributions": {
            "col": "B",
            "row": 59,
        },
    },
    2020: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
        "disputed_contributions": {
            "col": "B",
            "row": 59,
        },
    },
    2021: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
        "disputed_contributions": {
            "col": "B",
            "row": 59,
        },
    },
    2022: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
        "disputed_contributions": {
            "col": "B",
            "row": 59,
        },
    },
    2023: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
        "disputed_contributions": {
            "col": "B",
            "row": 59,
        },
    },
    2024: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
}

TRIENNIAL_STATUS_OF_CONTRIBUTIONS_SHEET_INFO = {
    (1991, 1993): {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 58,
    },
    (1994, 1996): {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 58,
    },
    (1997, 1999): {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 58,
    },
    (2000, 2002): {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 50,
    },
    (2003, 2005): {
        "cols": "A:F",
        "start_row": 7,
        "end_row": 50,
    },
    (2006, 2008): {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 53,
    },
    (2009, 2011): {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 55,
    },
    (2012, 2014): {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
    (2015, 2017): {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
    (2018, 2020): {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
    (2021, 2023): {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
    (2024, 2026): {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
}

DASHBOARD_DATA_INCOME = [
    {
        "start_year": 1991,
        "end_year": 1993,
        "col": "B",
    },
    {
        "start_year": 1994,
        "end_year": 1996,
        "col": "C",
    },
    {
        "start_year": 1997,
        "end_year": 1999,
        "col": "D",
    },
    {
        "start_year": 2000,
        "end_year": 2002,
        "col": "E",
    },
    {
        "start_year": 2003,
        "end_year": 2005,
        "col": "F",
    },
    {
        "start_year": 2006,
        "end_year": 2008,
        "col": "G",
    },
    {
        "start_year": 2009,
        "end_year": 2011,
        "col": "H",
    },
    {
        "start_year": 2012,
        "end_year": 2014,
        "col": "I",
    },
    {
        "start_year": 2015,
        "end_year": 2017,
        "col": "J",
    },
    {
        "start_year": 2018,
        "end_year": 2020,
        "col": "K",
    },
    {
        "start_year": 2021,
        "end_year": 2023,
        "col": "L",
    },
    {
        "start_year": 2024,
        "end_year": 2026,
        "col": "M",
    },
]
DASHBOARD_INCOME_INTEREST_EARNED_ROW = 19
DASHBOARD_INCOME_MISC_INCOME_ROW = 21

DASHBOARD_DATA_ALLOCATIONS = {
    "undp": {
        "row": 19,
        "col": "B",
    },
    "unep": {
        "row": 20,
        "col": "B",
    },
    "unido": {
        "row": 21,
        "col": "B",
    },
    "world_bank": {
        "row": 22,
        "col": "B",
    },
    "staff_contracts": {
        "row": 28,
        "col": "C",
    },
    "treasury_fees": {
        "row": 29,
        "col": "C",
    },
    "monitoring_fees": {
        "row": 30,
        "col": "C",
    },
    "technical_audit": {
        "row": 31,
        "col": "C",
    },
    "information_strategy": {
        "row": 33,
        "col": "C",
    },
}


def decimal_converter(value):
    try:
        return decimal.Decimal(str(value))
    except decimal.InvalidOperation:
        return decimal.Decimal(0)


CEIT = [
    {
        "country": "Azerbaijan",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Belarus",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Bulgaria",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Czechia",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Estonia",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Hungary",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Kazakhstan",
        "start_year": 2015,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Latvia",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Lithuania",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Poland",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Russian Federation",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Slovakia",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Slovenia",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Tajikistan",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Turkmenistan",
        "start_year": 1991,
        # It's actually 2004, but it's counted for the whole 2003-2005 triennial
        "end_year": 2005,
        "is_ceit": True,
    },
    {
        "country": "Ukraine",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
    {
        "country": "Uzbekistan",
        "start_year": 1991,
        "end_year": None,
        "is_ceit": True,
    },
]


@transaction.atomic
def import_status_of_contributions(countries):
    """
    Import the status of contributions
    """

    delete_old_data(AnnualContributionStatus)
    delete_old_data(TriennialContributionStatus)
    delete_old_data(DisputedContribution)
    delete_old_data(FermGainLoss)
    delete_old_data(ExternalIncome)
    delete_old_data(ExternalAllocation)
    delete_old_data(CountryCEITStatus)

    # Import CEIT status

    ceit_objects = []
    for ceit in CEIT:
        country = countries[ceit["country"]]
        ceit_objects.append(
            CountryCEITStatus(
                country=country,
                start_year=ceit["start_year"],
                end_year=ceit["end_year"],
                is_ceit=ceit["is_ceit"],
            )
        )
    CountryCEITStatus.objects.bulk_create(ceit_objects)
    logger.info(f"Imported ({len(ceit_objects)}) CEIT statuses")

    soc_file = pd.ExcelFile(IMPORT_RESOURCES_DIR / "9403_Annex_I_270524.xlsx")

    # Import annual contributions
    for year, info in ANNUAL_STATUS_OF_CONTRIBUTIONS_SHEET_INFO.items():
        contributions_status_objects = []
        default_contributions_status_objects = []
        status_of_contributions_df = soc_file.parse(
            sheet_name=f"YR{year}",
            usecols=info["cols"],
            skiprows=info["start_row"] - 1,
            nrows=info["end_row"] - info["start_row"],
            converters={
                "Party": str,
                "Agreed Contributions": decimal_converter,
                "Cash Payments": decimal_converter,
                "Bilateral Assistance": decimal_converter,
                "Promissory Notes": decimal_converter,
                "Disputed Contributions": decimal_converter,
                "Outstanding Contributions": decimal_converter,
            },
        )

        for _, row in status_of_contributions_df.iterrows():
            country_name_sheet = (
                row["Party"].replace("(*)", "").replace("*", "").strip()
            )
            country = countries[
                COUNTRY_MAPPING.get(country_name_sheet, country_name_sheet)
            ]

            contribution_status = AnnualContributionStatus(
                year=year,
                country=country,
                agreed_contributions=row["Agreed Contributions"],
                cash_payments=row["Cash Payments"],
                bilateral_assistance=row["Bilateral Assistance"],
                promissory_notes=row["Promissory Notes"],
                outstanding_contributions=row["Outstanding Contributions"],
            )

            if (
                contribution_status.agreed_contributions
                == contribution_status.cash_payments
                == contribution_status.bilateral_assistance
                == contribution_status.promissory_notes
                == contribution_status.outstanding_contributions
                == 0
            ):
                continue

            contributions_status_objects.append(contribution_status)

            if year == 2024:
                # Create basic contributions for 2025 and 2026. Only create annual ones,
                # as the triennial ones are created at contribution import time.
                annual_contribution_2025 = AnnualContributionStatus(
                    country=country,
                    year=2025,
                    agreed_contributions=contribution_status.agreed_contributions,
                )
                annual_contribution_2026 = AnnualContributionStatus(
                    country=country,
                    year=2026,
                    agreed_contributions=contribution_status.agreed_contributions,
                )
                default_contributions_status_objects.append(annual_contribution_2025)
                default_contributions_status_objects.append(annual_contribution_2026)

        AnnualContributionStatus.objects.bulk_create(contributions_status_objects)

        if default_contributions_status_objects:
            # If contributions for 2025/2026 were already created, do not overwrite them
            AnnualContributionStatus.objects.bulk_create(
                default_contributions_status_objects, ignore_conflicts=False
            )

        logger.info(
            f"Imported ({len(contributions_status_objects)}) Annual Status of Contributions for {year}"
        )

        if info.get("disputed_contributions") is None:
            continue

        # Disputed contributions annual data checks out with the Excel file
        disputed_contributions_info = info["disputed_contributions"]
        disputed_contributions_df = soc_file.parse(
            sheet_name=f"YR{year}",
            usecols=disputed_contributions_info["col"],
            skiprows=disputed_contributions_info["row"] - 1,
            nrows=1,
            header=None,
            converters={0: decimal_converter},
        )
        DisputedContribution.objects.create(
            year=year,
            amount=disputed_contributions_df.iloc[0, 0],
        )
        logger.info(
            f"Imported Disputed Contributions for {year}, amount {disputed_contributions_df.iloc[0, 0]}"
        )

    # Import triennial contributions
    for (
        start_year,
        end_year,
    ), info in TRIENNIAL_STATUS_OF_CONTRIBUTIONS_SHEET_INFO.items():
        contributions_status_objects = []
        status_of_contributions_df = soc_file.parse(
            sheet_name=f"YR{start_year}_{str(end_year)[-2:]}",
            usecols=info["cols"],
            skiprows=info["start_row"] - 1,
            nrows=info["end_row"] - info["start_row"],
            converters={
                "Party": str,
                "Agreed Contributions": decimal_converter,
                "Cash Payments": decimal_converter,
                "Bilateral Assistance": decimal_converter,
                "Promissory Notes": decimal_converter,
                "Outstanding Contributions": decimal_converter,
            },
        )

        for _, row in status_of_contributions_df.iterrows():
            country_name_sheet = (
                row["Party"].replace("(*)", "").replace("*", "").strip()
            )
            country = countries[
                COUNTRY_MAPPING.get(country_name_sheet, country_name_sheet)
            ]

            contribution_status = TriennialContributionStatus(
                start_year=start_year,
                end_year=end_year,
                country=country,
                agreed_contributions=row["Agreed Contributions"],
                cash_payments=row["Cash Payments"],
                bilateral_assistance=row["Bilateral Assistance"],
                promissory_notes=row["Promissory Notes"],
                outstanding_contributions=row["Outstanding Contributions"],
            )

            if (
                contribution_status.agreed_contributions
                == contribution_status.cash_payments
                == contribution_status.bilateral_assistance
                == contribution_status.promissory_notes
                == contribution_status.outstanding_contributions
                == 0
            ):
                continue

            contributions_status_objects.append(contribution_status)

        TriennialContributionStatus.objects.bulk_create(contributions_status_objects)

        logger.info(
            # pylint: disable=line-too-long
            f"Imported ({len(contributions_status_objects)}) Triennial Status of Contributions for {start_year}-{end_year}"
        )

    ferm_gain_loss_objects = []
    ferm_gain_loss_df = soc_file.parse(
        sheet_name="YR91_24",
        usecols="A,G",
        skiprows=8 - 1,
        nrows=63 - 8,
        converters={1: decimal_converter},
    )
    for _, row in ferm_gain_loss_df.iterrows():
        country_name_sheet = row["Party"].replace("(*)", "").replace("*", "").strip()
        country = countries[COUNTRY_MAPPING.get(country_name_sheet, country_name_sheet)]
        ferm_gain_loss_objects.append(
            FermGainLoss(
                country=country,
                amount=row.iloc[1],
            )
        )

    FermGainLoss.objects.bulk_create(ferm_gain_loss_objects)
    logger.info(f"Imported {len(ferm_gain_loss_objects)} Ferm Gain/Loss")

    # Import dashboard data
    external_incomes = []
    for info in DASHBOARD_DATA_INCOME:
        interest_earned = soc_file.parse(
            sheet_name="Statistics",
            usecols=info["col"],
            skiprows=DASHBOARD_INCOME_INTEREST_EARNED_ROW - 1,
            nrows=1,
            header=None,
            converters={0: decimal_converter},
        ).iloc[0, 0]
        miscellaneous_income = soc_file.parse(
            sheet_name="Statistics",
            usecols=info["col"],
            skiprows=DASHBOARD_INCOME_MISC_INCOME_ROW - 1,
            nrows=1,
            header=None,
            converters={0: decimal_converter},
        ).iloc[0, 0]
        external_incomes.append(
            ExternalIncome(
                start_year=info["start_year"],
                end_year=info["end_year"],
                interest_earned=interest_earned,
                miscellaneous_income=miscellaneous_income,
            )
        )

    ExternalIncome.objects.bulk_create(external_incomes)
    logger.info(f"Imported External Income Legacy- {len(external_incomes)} records")

    allocations_kwargs = {}
    for attribute, info in DASHBOARD_DATA_ALLOCATIONS.items():
        value = soc_file.parse(
            sheet_name="Status",
            usecols=info["col"],
            skiprows=info["row"] - 1,
            nrows=1,
            header=None,
            converters={0: decimal_converter},
        )
        allocations_kwargs[attribute] = value.iloc[0, 0]

    ExternalAllocation.objects.create(**allocations_kwargs)
    logger.info("Imported External Allocations")
