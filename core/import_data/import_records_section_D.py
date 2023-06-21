import logging
import pandas as pd
import numpy as np
from django.db import transaction
from django.conf import settings

from core.import_data.utils import (
    check_headers,
    delete_old_data,
    get_cp_report,
    get_chemical,
)
from core.models import CountryProgrammeSectionDRecord

REQUIRED_COLUMNS = [
    "Country",
    "Year",
    "Substance",
]

REPORT_COLUMNS = {
    "use": "Captured for all uses",
    "feedstock": "Captured for feedstock uses within your country",
    "destruction": "Captured for destruction",
}


logger = logging.getLogger(__name__)
FILE_NAME = "SectionCDE.xlsx"


def parse_sheet(df):
    """
    parse the sheet and import the data in database
    @param df = pandas dataframe
    """
    if not check_headers(df, REQUIRED_COLUMNS, logger):
        logger.error("Couldn't parse this sheet")
        return

    substance = None
    records_list = []
    for index_row, row in df.iterrows():
        # we have a single substance for the whole sheet
        if not substance:
            substance, _ = get_chemical(row["Substance"], index_row, logger)

        cp_report = get_cp_report(
            int(row["Year"]), row["Country"], None, index_row, logger
        )

        if cp_report:
            record_data = {
                "country_programme_report_id": cp_report.id,
                "substance": substance,
                "all_uses": row[REPORT_COLUMNS["use"]],
                "feedstock": row[REPORT_COLUMNS["feedstock"]],
                "destruction": row[REPORT_COLUMNS["destruction"]],
                "source_file": FILE_NAME,
            }
            records_list.append(CountryProgrammeSectionDRecord(**record_data))
    CountryProgrammeSectionDRecord.objects.bulk_create(records_list)
    logger.info("✔ sheet parsed")


def parse_file(file_path):
    df = pd.read_excel(file_path, sheet_name=" Section D")
    # replace nan with None
    df = df.replace(np.nan, None)
    parse_sheet(df)


@transaction.atomic
def import_records():
    file_path = settings.IMPORT_DATA_DIR / "records" / FILE_NAME

    logger.info(f"⏳ parsing file: {FILE_NAME}")
    # before we import anything, we should delete all prices from previous imports
    delete_old_data(CountryProgrammeSectionDRecord, FILE_NAME, logger)

    parse_file(file_path)
    logger.info(f"✔ section D records from {FILE_NAME} imported")
