import decimal
import logging
import pandas as pd
import numpy as np

from django.db import transaction
from django.conf import settings
from core.import_data.utils import (
    check_empty_row,
    check_headers,
    create_cp_record,
    delete_old_data,
    get_cp_report,
    get_country_by_name,
    get_chemical,
    OFFSET,
    get_decimal_from_excel_string,
    get_usages_from_sheet,
)

from core.models import (
    CPRecord,
)
from core.models.country_programme import CPUsage

logger = logging.getLogger(__name__)

NON_USAGE_COLUMNS = {
    "no.",
    "country",
    "status",
    "chemical",
    "gwp",
    "year",
    "total",
    "import",
    "export",
    "production",
    "manufacturing of blends",
    "import quotas",
    "ctr",
}

REQUIRED_COLUMNS = [
    "country",
    "chemical",
    "year",
    "total",
]

RECORD_COLUMNS_MAPPING = {
    "import": "imports",
    "export": "exports",
    "production": "production",
    "manufacturing of blends": "manufacturing_blends",
    "import quotas": "import_quotas",
}

SECTION = "B"

FILE_LIST = [
    {
        "file_name": "SectionA.xlsx",
        "convert_to_mt": True,
        "section": "A",
    },
    {
        "file_name": "SectionB.xlsx",
        "convert_to_mt": False,
        "section": "B",
    },
]

# error value for comparing gwp values
GWP_EPSILON = 0.0001


def check_gwp_value(obj, gwp_value, index_row):
    """
    check if the gwp_value is the same as chemical gwp value from database
    @param obj = Substance or Blend
    @param gwp_value = float
    @param index_row = int
    """
    if isinstance(gwp_value, str):
        gwp_value = gwp_value.strip()

    if not gwp_value:
        return

    try:
        gwp_value = decimal.Decimal(gwp_value)
    except decimal.InvalidOperation:
        logger.warning(
            f"⚠️ [row: {index_row + OFFSET}] The gwp value is not a number: {gwp_value}"
        )
        return

    if abs(obj.gwp - gwp_value) > GWP_EPSILON:
        logger.warning(
            f"⚠️ [row: {index_row + OFFSET}] The gwp values are different "
            f"(file_value: {gwp_value}, database_value: {obj.gwp})"
        )


# pylint: disable=R0914
def parse_sheet(df, file_details):
    """
    parse the sheet and import the data in database
    @param df = pandas dataframe
    @param file_details = dict (file_name, session, convert_to_mt)
    """
    if not check_headers(df, REQUIRED_COLUMNS):
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
        if row["chemical"].strip().lower() == "total":
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
                    row["year"], current_country["obj"].name, current_country["obj"].id
                )

        if not current_country["obj"]:
            # we didn't found a country in db:
            continue

        # another year => another country program
        if current_cp.year != row["year"]:
            current_cp = get_cp_report(
                row["year"], current_country["obj"].name, current_country["obj"].id
            )

        # get chemical
        # Other1 from Cuba is R-417A
        chemical_name = row["chemical"]
        if row["chemical"] == "Other1" and current_country["obj"].name == "Cuba":
            chemical_name = "R-417A"

        gwp_value = row.get("gwp", None)
        substance, blend = get_chemical(chemical_name, index_row)
        if not substance and not blend:
            continue

        check_gwp_value(substance or blend, gwp_value, index_row)

        # get odp value
        if file_details["convert_to_mt"]:
            odp_value = substance.odp if substance else blend.odp
            if not odp_value:
                logger.error(
                    f"[row: {index_row + OFFSET}] The ODP value is not defined for this chemical:"
                    f" {chemical_name}"
                )
                continue
        else:
            odp_value = 1

        # set record data
        record_data = {
            "country_programme_report_id": current_cp.id,
            "substance_id": substance.id if substance else None,
            "blend_id": blend.id if blend else None,
            "section": file_details["section"],
            "display_name": row["chemical"],
            "source_file": file_details["file_name"],
        }
        for colummn_name, filed_name in RECORD_COLUMNS_MAPPING.items():
            column_value = get_decimal_from_excel_string(row.get(colummn_name, None))
            if column_value:
                record_data[filed_name] = column_value / odp_value

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
                    "quantity": quantity / odp_value,
                }
            )

        cp_usages.extend(create_cp_record(record_data, usages_data, index_row))

    CPUsage.objects.bulk_create(cp_usages, batch_size=1000)

    logger.info("✔ sheet parsed")


def parse_file(file_path, file_details):
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

        parse_sheet(df, file_details)


@transaction.atomic
def import_records():
    for file in FILE_LIST:
        file_path = settings.IMPORT_DATA_DIR / "records" / file["file_name"]

        logger.info(f"⏳ parsing file: {file['file_name']}")
        delete_old_data(CPRecord, file["file_name"])
        parse_file(file_path, file)

        logger.info(f"✔ records from {file['file_name']} imported")
