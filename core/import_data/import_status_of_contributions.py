import decimal

import pandas as pd
from django.db import transaction

from core.import_data.utils import IMPORT_RESOURCES_DIR, delete_old_data
from core.models import ContributionStatus


STATUS_OF_CONTRIBUTIONS_SHEET_INFO = {
    1991: {
        "sheet": "YR1991",
        "cols": "A:F",
        "skiprows": 6,
        "nrows": 51,
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

    soc_file = pd.ExcelFile(IMPORT_RESOURCES_DIR / "9303p2.xlsx")

    for year, info in STATUS_OF_CONTRIBUTIONS_SHEET_INFO.items():
        contributions_status_objects = []
        sheet = soc_file.parse(
            sheet_name=info["sheet"],
            usecols=info["cols"],
            skiprows=info["skiprows"],
            nrows=info["nrows"],
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
            country = countries[row["Party"]]
            contribution_status = ContributionStatus(
                year=year,
                country=country,
                agreed_contributions=row["Agreed Contributions"],
                cash_payments=row["Cash Payments"],
                bilateral_assistance=row["Bilateral Assistance"],
                promissory_notes=row["Promissory Notes"],
                disputed_contributions=row["Disputed Contributions"],
                outstanding_contributions=row["Outstanding Contributions"],
            )
            contributions_status_objects.append(contribution_status)

        ContributionStatus.objects.bulk_create(contributions_status_objects)
