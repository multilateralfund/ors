import logging
import pandas as pd

from django.db import transaction
from django.conf import settings

from core.models import Country, CountryProgrammeReport, Record, Substance, Blend, Usage

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


def get_country(country_name):
    country = Country.objects.get_by_name(country_name).first()
    if not country:
        logger.warning(f"This country does not exists: {country_name}")
        return
    return country


def get_country_program(row, file_name, country):
    """
    get or create country program for this row
    @param row = Series (current row from sheet)
    @param file_name = string
    @param country = Country obj

    @return country_program = CountryProgrammeReport object
    """
    cp_name = f"{country.name} {row['Year']}"
    cp, _ = CountryProgrammeReport.objects.get_or_create(
        name=cp_name, year=row["Year"], country_id=country.id, source=file_name
    )

    return cp


def get_chemical(chemical_name):
    """
    parse chemical name from row and return substance_id or blend_id:
        - if the chemical is a substance => return (substance_id, None)
        - if the chemical is a blend => return (None, blend_id)
        - if we can't find this chemical => return (None, None)
    @param chemical_name string

    @return tuple => (int, None) or (None, int) or (None, None)
    """

    # HFC-23 (use) => HFC-23
    # R-404A (HFC-125=44%, HFC-134a=4%, HFC-143a=52%) => R-404A
    chemical_name = chemical_name.split(" ", 1)[0]

    substance = Substance.objects.get_by_name(chemical_name).first()
    if substance:
        return substance.id, None

    blend = Blend.objects.get_by_name(chemical_name).first()
    if blend:
        return None, blend.id

    logger.warning(f"This chemical does not exists: {chemical_name}")
    return None, None


def parse_sheet(df, file_name, section):
    if not check_headers(df):
        logger.error("Couldn't parse this sheet")
        return
    usage_dict = get_usages_from_sheet(df)
    current_country_name = None
    current_country_obj = None
    current_cp = None
    records = []
    for i, row in df.iterrows():
        if row["Chemical"] == "TOTAL":
            continue

        # another country => another country program
        if row["Country"] != current_country_name:
            current_country_name = row["Country"]
            current_country_obj = get_country(current_country_name)
            if current_country_obj:
                current_cp = get_country_program(row, file_name, current_country_obj)

        if not current_country_obj:
            # we didn't found a country in db:
            continue

        # another year => another country program
        if current_cp.year != row["Year"]:
            current_cp = get_country_program(row, file_name, current_country_obj)

        # get chemical
        substance_id, blend_id = get_chemical(row["Chemical"])
        if not substance_id and not blend_id:
            continue

        # insert records
        for usage in usage_dict:
            if pd.isna(row[usage]):
                continue

            record_data = {
                "substance_id": substance_id,
                "blend_id": blend_id,
                "country_programme_report_id": current_cp.id,
                "usage_id": usage_dict[usage].id,
                "value_metric": row[usage],
                "section": section,
            }
            records.append(Record(**record_data))

    Record.objects.bulk_create(records)

    logger.info("✔ sheet parsed")


def parse_file(file_path, cp_name, section):
    all_sheets = pd.read_excel(file_path, sheet_name=None)
    for sheet_name, df in all_sheets.items():
        logger.info(f"Start parsing sheet: {sheet_name}")
        parse_sheet(df, cp_name, section)


def drop_old_data(file_name):
    CountryProgrammeReport.objects.filter(
        source__iexact=file_name.lower()
    ).all().delete()


@transaction.atomic
def import_records():
    file_name = "CP_Data_SectionB_2019_2021.xlsx"
    section = "B"
    file_path = settings.ROOT_DIR / "import_data/records" / file_name

    drop_old_data(file_name)
    parse_file(file_path, file_name, section)

    logger.info("✔ records imported")
