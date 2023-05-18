import itertools
import logging
import re
import pandas as pd

from django.db import transaction
from django.conf import settings
from core.import_data.utils import (
    COUNTRY_NAME_MAPPING,
    delete_old_cp_records,
    get_blend_id_by_name_or_components,
    get_cp_report,
    get_object_by_name,
    get_substance_id_by_name,
)

from core.models import (
    Country,
    CountryProgrammeRecord,
    Usage,
)

logger = logging.getLogger(__name__)

NON_USAGE_COLUMNS = {
    "No.",
    "Country",
    "Status",
    "Chemical",
    "GWP",
    "Year",
    "TOTAL (MT)",
}

REQUIRED_COLUMNS = [
    "Country",
    "Chemical",
    "Year",
]

SECTION = "B"

# "R-404A (HFC-125=44%, HFC-134a=4%, HFC-143a=52%)" => [("HFC-125", "44"), ("HFC-134a", "4"), ("HFC-143a", "52")]
BLEND_COMPONENTS_RE = r"(\w{1,4}\-?\s?\w{2,7})\s?=?-?\s?\(?(\d{1,3}\.?\,?\d{,3})\%\)?"
# "R23/R125/CO2/HFO-1132 (10%/10%/60%/20%)"
BLEND_COMPOSITION_RE = r"((/[a-zA-Z0-9/-]{3,15})+\s?\(\d{1,3}\.?\,?\d{,2}?%)"


def check_headers(df):
    for c in REQUIRED_COLUMNS:
        if c not in df.columns:
            logger.error(f"Invalid column list.")
            logger.warning(f"The following columns are required: {REQUIRED_COLUMNS}")
            return False
    return True


def get_usage_from_column_name(column_name):
    # Refrigeration Manufacturing - AC (MT) => Refrigeration Manufacturing AC

    # remove MT
    column_name = column_name.replace(" (MT)", "")
    # remove -
    column_name = column_name.replace("- ", "")
    # remove Total (Refrigeration Manufacturing - Total (MT))
    column_name = column_name.replace(" Total", "")

    return column_name


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

        usage_name = get_usage_from_column_name(column_name)

        usage = Usage.objects.get_by_name(usage_name).first()
        if not usage:
            logger.warning(f"This usage is not exists: {column_name} ({usage_name})")
            continue
        usage_dict[column_name] = usage

    return usage_dict


def get_country(country_name, index_row):
    """
    get country object from country name
    @param country_name = string
    """
    country_name = COUNTRY_NAME_MAPPING.get(country_name, country_name)
    country = get_object_by_name(Country, country_name, index_row, "country", logger)
    return country


def parse_chemical_name(chemical_name):
    """
    Parse chemical name from row and return chemical_search_name and components list:
        e.g.:
        R-404A (HFC-125=44%, HFC-134a=4%, HFC-143a=52%) => ("R-404A", [("HFC-125", "44"), ("HFC-134a", "4"), ("HFC-143a", "52")])
        R125/R218/R290 (86%/9%/5%) =>R125/R218/R290 (86%/9%/5%),   [('R125', '86'), ('R218', '9'), ('R290', '5')]
    @param chemical_name string
    @return tuple => (chemical_search_name, components)
        - chemical_search_name = string
        - components = list of tuple (substance_name, percentage)
    """
    # remove Fullwidth Right Parenthesis
    chemical_name = chemical_name.replace("）", ")").strip()

    # R32/R125/R134a/HFO (24%/25%/26%/25%)
    if re.search(BLEND_COMPOSITION_RE, chemical_name):
        substances, percentages = chemical_name.split("(")
        substances = substances.strip().split("/")
        percentages = re.findall(r"(\d{1,3}\.?\,?\d{,3})\%", percentages)
        if len(substances) != len(percentages):
            return chemical_name, []
        components = list(zip(substances, percentages))
        return chemical_name, components

    components = re.findall(BLEND_COMPONENTS_RE, chemical_name)
    if components:
        # check if the number of components is equal to the number of %
        if chemical_name.count("%") != len(components):
            # R-514A (HFO-1336mzz=74,7%, trans-Dicloroetileno=25,3%) => components = [HFO-1336mzz, 74.7]
            components = []

        components = [(c.strip().replace(" ", "-"), p) for c, p in components]
        chemical_search_name = chemical_name.split("(")[0].strip()
        return chemical_search_name, components

    return chemical_name, components


def get_chemical(chemical_name, index_row):
    """
    parse chemical name from row and return substance_id or blend_id:
        - if the chemical is a substance => return (substance_id, None)
        - if the chemical is a blend => return (None, blend_id)
        - if we can't find this chemical => return (None, None)
    @param chemical_name string

    @return tuple => (int, None) or (None, int) or (None, None)
    """

    chemical_search_name, components = parse_chemical_name(chemical_name)
    substance_id = get_substance_id_by_name(chemical_search_name)
    if substance_id:
        return substance_id, None

    blend_id = get_blend_id_by_name_or_components(chemical_search_name, components)
    if blend_id:
        return None, blend_id

    logger.warning(
        f"[row: {index_row}]: "
        f"This chemical does not exist: {chemical_name}, "
        f"Searched name: {chemical_search_name}, searched components: {components}"
    )
    return None, None


def parse_sheet(df, file_name):
    if not check_headers(df):
        logger.error("Couldn't parse this sheet")
        return
    usage_dict = get_usages_from_sheet(df)
    current_country_name = None
    current_country_obj = None
    current_cp = None
    records = []
    for index_row, row in df.iterrows():
        if row["Chemical"] == "TOTAL":
            continue

        # another country => another country program
        if row["Country"] != current_country_name:
            current_country_name = row["Country"]
            current_country_obj = get_country(current_country_name, index_row)
            if current_country_obj:
                current_cp = get_cp_report(
                    row["Year"], current_country_obj.name, current_country_obj.id
                )

        if not current_country_obj:
            # we didn't found a country in db:
            continue

        # another year => another country program
        if current_cp.year != row["Year"]:
            current_cp = get_cp_report(
                row["Year"], current_country_obj.name, current_country_obj.id
            )

        # get chemical
        # Other1 from Cuba is R-417A
        chemical_name = row["Chemical"]
        if row["Chemical"] == "Other1" and current_country_obj.name == "Cuba":
            chemical_name = "R-417A"

        substance_id, blend_id = get_chemical(chemical_name, index_row)
        if not substance_id and not blend_id:
            continue

        # insert records
        for usage in usage_dict:
            if pd.isna(row[usage]) or not row[usage]:
                # if the value is empty or is 0 => skip
                continue

            record_data = {
                "substance_id": substance_id,
                "blend_id": blend_id,
                "country_programme_report_id": current_cp.id,
                "usage_id": usage_dict[usage].id,
                "value_metric": row[usage],
                "section": SECTION,
                "source": file_name,
            }
            records.append(CountryProgrammeRecord(**record_data))

    CountryProgrammeRecord.objects.bulk_create(records)

    logger.info("✔ sheet parsed")


def parse_file(file_path, cp_name):
    all_sheets = pd.read_excel(file_path, sheet_name=None)
    for sheet_name, df in all_sheets.items():
        logger.info(f"Start parsing sheet: {sheet_name}")
        df = df.rename(columns=lambda x: x.strip())
        parse_sheet(df, cp_name)


@transaction.atomic
def import_records():
    file_name = "CP Data-SectionB-2019-2021.xlsx"
    file_path = settings.IMPORT_DATA_DIR / "records" / file_name

    delete_old_cp_records(file_name, logger)
    parse_file(file_path, file_name)

    logger.info("✔ records imported")
