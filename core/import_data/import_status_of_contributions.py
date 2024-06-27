import decimal
import logging

import pandas as pd
from django.db import transaction

from core.import_data.utils import IMPORT_RESOURCES_DIR, delete_old_data
from core.models import ContributionStatus


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
    },
    2008: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 53,
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
    },
    2013: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
    2014: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
    2015: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
    2016: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
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
    },
    2019: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
    2020: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
    2021: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
    2022: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
    2023: {
        "cols": "A:F",
        "start_row": 8,
        "end_row": 57,
    },
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

    soc_file = pd.ExcelFile(IMPORT_RESOURCES_DIR / "9303p2.xlsx")

    for year, info in STATUS_OF_CONTRIBUTIONS_SHEET_INFO.items():
        contributions_status_objects = []
        sheet = soc_file.parse(
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

        for index, row in sheet.iterrows():
            country_name_sheet = (
                row["Party"].replace("(*)", "").replace("*", "").strip()
            )
            country = countries[
                COUNTRY_MAPPING.get(country_name_sheet, country_name_sheet)
            ]
            contribution_status = ContributionStatus(
                year=year,
                country=country,
                agreed_contributions=row["Agreed Contributions"],
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

        # TODO: disputed contributions

        # TODO: CEITs
