import logging
import pandas as pd
import numpy as np

from django.db import transaction
from django.conf import settings
from core.import_data.utils import (
    check_empty_row,
    check_headers,
    create_cp_record,
    get_cp_report,
    get_country_by_name,
    get_chemical,
    get_decimal_from_excel_string,
    get_usages_from_sheet,
)

from core.models.country_programme import CPRecord, CPUsage

# pylint: disable=R0914
logger = logging.getLogger(__name__)

SECTION = "A"

NON_USAGE_COLUMNS = {
    "country",
    "substance",
    "year",
    "total",
    "import",
    "export",
    "production",
}

RECORD_COLUMNS_MAPPING = {
    "import": "imports",
    "export": "exports",
    "production": "production",
}


def parse_sheet(df, year, file_name):
    if not check_headers(df, NON_USAGE_COLUMNS):
        logger.error("Couldn't parse this sheet")
        return

    usage_dict = get_usages_from_sheet(df, NON_USAGE_COLUMNS)
    quantity_columns = list(usage_dict) + list(RECORD_COLUMNS_MAPPING)
    current_country = {
        "name": None,
        "obj": None,
    }
    current_cp = None
    cp_usages = []
    for index_row, row in df.iterrows():
        if row["substance"].strip().lower() == "total":
            continue

        # check if the row is empty
        if check_empty_row(row, index_row, quantity_columns):
            continue

        # another country => another country program
        if row["country"] != current_country["name"]:
            current_country["name"] = row["country"]
            current_country["obj"] = get_country_by_name(
                current_country["name"], index_row
            )
            if current_country["obj"]:
                current_cp = get_cp_report(
                    year, current_country["obj"].name, current_country["obj"].id
                )

        if not current_country["obj"]:
            # we didn't found a country in db:
            continue

        # get chemical
        # OTHER from Cuba is R-417A
        chemical_name = row["substance"]
        if row["substance"] == "OTHER" and current_country["obj"].name == "Cuba":
            chemical_name = "R-417A"

        substance, blend = get_chemical(chemical_name, index_row)
        if not substance and not blend:
            continue

            # set record data
        record_data = {
            "country_programme_report_id": current_cp.id,
            "substance_id": substance.id if substance else None,
            "blend_id": blend.id if blend else None,
            "section": SECTION,
            "display_name": row["substance"],
            "source_file": file_name,
        }
        for colummn_name, filed_name in RECORD_COLUMNS_MAPPING.items():
            column_value = get_decimal_from_excel_string(row.get(colummn_name, None))
            if column_value:
                record_data[filed_name] = column_value

        # set usages data
        usages_data = []
        for usage_name, usage in usage_dict.items():
            # check if the usage is empty or not a number
            quantity = get_decimal_from_excel_string(row.get(usage_name, None))
            if not quantity:
                continue

            usages_data.append(
                {
                    "usage": usage,
                    "quantity": quantity,
                }
            )
        cp_usages.extend(
            create_cp_record(
                record_data,
                usages_data,
                index_row,
                update_or_log="update",
            )
        )
    CPUsage.objects.bulk_create(cp_usages, batch_size=1000)

    logger.info("✔ sheet parsed")


def parse_file(file_path):
    all_sheets = pd.read_excel(file_path, sheet_name=None, na_values="NDR", dtype=str)
    for sheet_name, df in all_sheets.items():
        # if the sheet_name is not a year => skip
        if not sheet_name.strip().isdigit():
            continue

        logger.info(f"Start parsing sheet: {sheet_name}")

        # set column names
        df = df.rename(columns=lambda x: x.replace("(MT)", "").strip().lower())
        # replace nan with None
        df = df.replace(np.nan, None)

        parse_sheet(df, sheet_name, file_path)


@transaction.atomic
def import_records_95_04():
    logger.info("⏳ importing records section from 1995 to 2004")
    file_path = settings.IMPORT_DATA_DIR / "records" / "CPDataSubmitted_94_04.xlsx"
    parse_file(file_path)
    logger.info("✔ records section from 1995 to 2004 imported")
