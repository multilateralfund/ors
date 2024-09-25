import logging
import pandas as pd
import numpy as np
from django.db import transaction
from django.conf import settings

from core.import_data.utils import (
    check_headers,
    get_cp_report,
    get_import_user,
    is_imported_today,
)
from core.models import CPEmission


REQUIRED_COLUMNS = [
    "Country",
    "Year",
]

REPORT_COLUMNS = {
    "facility": "Facility name or identifier",
    "total": "Total amount generated",
    "all_uses": "Amount generated and captured - For all uses",
    "feedstock_gc": "Amount generated and captured - For feedstock use in your country",
    "destruction": "Amount generated and captured - For destruction",
    "feedstock_wpc": "Amount used for feedstock without prior capture",
    "destruction_wpc": "Amount destroyed without prior capture",
    "generated_emissions": "Amount of generated emissions",
}


logger = logging.getLogger(__name__)
FILE_NAME = "SectionCDE.xlsx"


def parse_sheet(df):
    """
    parse the sheet and import the data in database
    @param df = pandas dataframe
    """
    if not check_headers(df, REQUIRED_COLUMNS):
        logger.error("Couldn't parse this sheet")
        return

    system_user = get_import_user()

    cp_report = None
    records_list = []

    for index_row, row in df.iterrows():
        year = row["Year"]
        country_name = row["Country"]

        if (
            not cp_report
            or cp_report.year != year
            or cp_report.country.name != country_name
        ):
            cp_report = get_cp_report(int(row["Year"]), row["Country"], None, index_row)

            if not cp_report:
                continue

        # We cannot update reports imported before today or created by a different user
        if not is_imported_today(cp_report, system_user):
            continue

        record_data = {
            "country_programme_report_id": cp_report.id,
            "facility": row[REPORT_COLUMNS["facility"]],
            "total": row[REPORT_COLUMNS["total"]],
            "all_uses": row[REPORT_COLUMNS["all_uses"]],
            "feedstock_gc": row[REPORT_COLUMNS["feedstock_gc"]],
            "destruction": row[REPORT_COLUMNS["destruction"]],
            "feedstock_wpc": row[REPORT_COLUMNS["feedstock_wpc"]],
            "destruction_wpc": row[REPORT_COLUMNS["destruction_wpc"]],
            "generated_emissions": row[REPORT_COLUMNS["generated_emissions"]],
            "remarks": row["Remarks"],
            "source_file": FILE_NAME,
        }
        records_list.append(CPEmission(**record_data))
    CPEmission.objects.bulk_create(records_list, batch_size=1000)
    logger.info("✔ sheet parsed")


def parse_file(file_path):
    df = pd.read_excel(file_path, sheet_name="Section E")
    # replace nan with None
    df = df.replace(np.nan, None)
    parse_sheet(df)


@transaction.atomic
def import_records():
    file_path = settings.IMPORT_DATA_DIR / "records" / FILE_NAME

    logger.info(f"⏳ parsing file: {FILE_NAME}")

    parse_file(file_path)
    logger.info(f"✔ section E records from {FILE_NAME} imported")
