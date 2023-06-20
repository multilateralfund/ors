import logging
import pandas as pd
import numpy as np
from django.db import transaction
from django.conf import settings

from core.import_data.utils import (
    check_headers,
    delete_old_data,
    get_cp_report_by_country_name,
)
from core.models import CountryProgrammeSectionERecord, Substance


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
    if not check_headers(df, REQUIRED_COLUMNS, logger):
        logger.error("Couldn't parse this sheet")
        return

    # we have a single substance for the whole sheet
    substance = Substance.objects.filter(name="HFC-23").first()
    if not substance:
        logger.warning(
            "⚠️ Substance 'HFC-23 not found. Please run `./manage.py import_resources` command before this one."
        )
    cp_report = None

    for index_row, row in df.iterrows():
        year = row["Year"]
        country_name = row["Country"]

        if (
            not cp_report
            or cp_report.year != year
            or cp_report.country.name != country_name
        ):
            cp_report = get_cp_report_by_country_name(
                row["Country"], int(row["Year"]), index_row, logger
            )

            if not cp_report:
                continue

        record_data = {
            "country_programme_report_id": cp_report.id,
            "substance": substance,
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
        CountryProgrammeSectionERecord.objects.create(**record_data)
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
    # before we import anything, we should delete all prices from previous imports
    delete_old_data(CountryProgrammeSectionERecord, FILE_NAME, logger)

    parse_file(file_path)
    logger.info(f"✔ section E records from {FILE_NAME} imported")
