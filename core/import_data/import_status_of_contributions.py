import decimal
import logging

import pandas as pd
from django.db import transaction

from core.import_data.utils import IMPORT_RESOURCES_DIR, delete_old_data
from core.models import ContributionStatus, DisputedContribution, FermGainLoss


logger = logging.getLogger(__name__)

COUNTRY_MAPPING = {
    "Czech Republic": "Czechia",
    "Slovak Republic": "Slovakia",
    "Netherlands": "Netherlands (Kingdom of the)",
    "United Kingdom": "United Kingdom of Great Britain and Northern Ireland",
}

# Indices are 1-based like in Excel for easier comparison
STATUS_OF_CONTRIBUTIONS_SHEET_INFO = {
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
    },
}

CONTRIBUTION_AMOUNT_MODIFIER = {
    1996: {
        "FRA": decimal.Decimal("-693288"),
        "DEU": decimal.Decimal("-171486"),
        "ITA": decimal.Decimal("-1568782"),
        "JPN": decimal.Decimal("-5164674"),
        "GBR": decimal.Decimal("-500037"),
    }
}


def decimal_converter(value):
    try:
        return decimal.Decimal(str(value))
    except decimal.InvalidOperation:
        return 0


@transaction.atomic
def import_status_of_contributions(countries):
    """
    Import the status of contributions
    """

    delete_old_data(ContributionStatus)
    delete_old_data(DisputedContribution)
    delete_old_data(FermGainLoss)

    soc_file = pd.ExcelFile(IMPORT_RESOURCES_DIR / "9303p2.xlsx")

    for year, info in STATUS_OF_CONTRIBUTIONS_SHEET_INFO.items():
        contributions_status_objects = []
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

            agreed_contributions = row["Agreed Contributions"]
            if (
                year in CONTRIBUTION_AMOUNT_MODIFIER
                and country.iso3 in CONTRIBUTION_AMOUNT_MODIFIER[year]
            ):
                modifier = CONTRIBUTION_AMOUNT_MODIFIER[year][country.iso3]
                logger.info(
                    f"Applying modifier for {country.name} in {year}: {modifier}"
                )
                agreed_contributions += modifier

            contribution_status = ContributionStatus(
                year=year,
                country=country,
                agreed_contributions=agreed_contributions,
                cash_payments=row["Cash Payments"],
                bilateral_assistance=row["Bilateral Assistance"],
                promissory_notes=row["Promissory Notes"],
                outstanding_contributions=row["Outstanding Contributions"],
            )
            contributions_status_objects.append(contribution_status)

        ContributionStatus.objects.bulk_create(contributions_status_objects)

        logger.info(
            f"Imported ({len(contributions_status_objects)}) Status of Contributions for {year}"
        )

        if info.get("disputed_contributions") is None:
            continue

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

    ferm_gain_loss_objects = []
    ferm_gain_loss_df = soc_file.parse(
        sheet_name="YR91_23",
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
