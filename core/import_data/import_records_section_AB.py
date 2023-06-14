import decimal
import logging
import pandas as pd
import numpy as np

from django.db import transaction
from django.conf import settings
from core.import_data.utils import (
    check_empty_row,
    delete_old_data,
    get_chemical_by_name_or_components,
    get_cp_report,
    get_country,
    parse_chemical_name,
    OFFSET
)

from core.models import (
    CountryProgrammeRecord,
    Usage,
)
from core.models.country_programme import CountryProgrammeUsage

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


def check_headers(df):
    for c in REQUIRED_COLUMNS:
        if c not in df.columns:
            logger.error("Invalid column list.")
            logger.warning(f"The following columns are required: {REQUIRED_COLUMNS}")
            return False
    return True


def get_usages_from_sheet(df):
    """
    parse the df columns and extract the usages
    @param df = pandas dataFrame

    @return usage_dict = dictionary ({column_name: Usage obj})
    """
    usage_dict = {}
    for column_name in df.columns:
        if column_name in NON_USAGE_COLUMNS:
            continue

        usage_name = column_name.replace("- ", "")

        usage = Usage.objects.get_by_name(usage_name).first()
        if not usage:
            logger.warning(f"This usage is not exists: {column_name} ({usage_name})")
            continue
        usage_dict[column_name] = usage

    return usage_dict


def check_gwp_value(obj, gwp_value, index_row):
    """
    check if the gwp_value is the same as chemical gwp value from database
    @param obj = Substance or Blend
    @param gwp_value = float
    @param index_row = int

    @return boolean
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


def get_chemical_and_check_gwp(chemical_name, gwp_value, index_row):
    """
    parse chemical name from row and return substance_id or blend_id:
        - if the chemical is a substance => return (substance_id, None)
        - if the chemical is a blend => return (None, blend_id)
        - if we can't find this chemical => return (None, None)
    and check if the gwp_value is the same as chemical gwp value from database
    @param chemical_name string
    @param gwp_value float
    @param index_row int

    @return tuple => (int, None) or (None, int) or (None, None)
    """

    chemical_search_name, components = parse_chemical_name(chemical_name)
    chemical, chemical_type = get_chemical_by_name_or_components(
        chemical_search_name, components
    )

    if not chemical:
        logger.warning(
            f"[row: {index_row + OFFSET}]: "
            f"This chemical does not exist: {chemical_name}, "
            f"Searched name: {chemical_search_name}, searched components: {components}"
        )
        return None, None
    check_gwp_value(chemical, gwp_value, index_row)

    if chemical_type == "substance":
        return chemical, None

    return None, chemical


# pylint: disable=R0914
def parse_sheet(df, file_details):
    """
    parse the sheet and import the data in database
    @param df = pandas dataframe
    @param file_details = dict (file_name, session, convert_to_mt)
    """
    if not check_headers(df):
        logger.error("Couldn't parse this sheet")
        return
    usage_dict = get_usages_from_sheet(df)
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
        if check_empty_row(row, index_row, quantity_columns, logger):
            continue

        # another country => another country program
        if row["country"] != current_country["name"]:
            current_country["name"] = row["country"]
            current_country["obj"] = get_country(
                current_country["name"], index_row, logger
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
        substance, blend = get_chemical_and_check_gwp(
            chemical_name, gwp_value, index_row
        )
        if not substance and not blend:
            continue

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

        # create record
        record_data = {
            "country_programme_report_id": current_cp.id,
            "substance": substance,
            "blend": blend,
            "section": file_details["section"],
            "display_name": row["chemical"],
            "source_file": file_details["file_name"],
        }
        for colummn_name, filed_name in RECORD_COLUMNS_MAPPING.items():
            if row.get(colummn_name, None):
                record_data[filed_name] = decimal.Decimal(row[colummn_name]) / odp_value
        record = CountryProgrammeRecord.objects.create(**record_data)

        # insert records
        for usage_name, usage in usage_dict.items():
            # check if the usage is empty or not a number
            if not row[usage_name] or not isinstance(row[usage_name], (int, float)):
                continue

            usage_data = {
                "country_programme_record_id": record.id,
                "usage_id": usage.id,
                "quantity": decimal.Decimal(row[usage_name]) / odp_value,
            }
            cp_usages.append(CountryProgrammeUsage(**usage_data))

    CountryProgrammeUsage.objects.bulk_create(cp_usages)

    logger.info("✔ sheet parsed")


def parse_file(file_path, file_details):
    all_sheets = pd.read_excel(file_path, sheet_name=None, na_values="NDR")
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
        delete_old_data(CountryProgrammeRecord, file["file_name"], logger)
        parse_file(file_path, file)

        logger.info(f"✔ records from {file['file_name']} imported")
