import logging
import numpy as np
import os
import pandas as pd
import re

from django.db import transaction
from django.conf import settings

from core.import_data.mapping_names_dict import (
    BP_SECTOR_SUBSECTOR_MAPPING,
    SECTOR_NAME_MAPPING,
)
from core.import_data.utils import (
    get_chemical_by_name_or_components,
    get_country_by_name,
    get_decimal_from_excel_string,
    get_object_by_name,
    get_project_type_by_code,
    get_sector_subsector_details,
)
from core.models.agency import Agency
from core.models.business_plan import (
    BPChemicalType,
    BPActivity,
    BPActivityValue,
    BusinessPlan,
)

logger = logging.getLogger(__name__)

YEAR_REGEX = r"(\d{4})\-(\d{4})"
SECTOR_REGEX = r"(?P<sector>[A-Z]{3,4})"
SUBSECTOR_REGEX = r"([A-Z]{3,4}|Stage\s\w{1,3})\s?\-(?P<subsector>.*)"


def get_or_create_bp_chemical_type(chemical_type_name):
    """
    Get or create BPChemicalType object

    @param chemical_type_name: chemical type name

    @return: BPChemicalType object
    """
    if not chemical_type_name:
        return None

    chemical_type_name = chemical_type_name.strip()
    chemical_type, _ = BPChemicalType.objects.get_or_create(name=chemical_type_name)

    return chemical_type


def get_values_columns(df, year_start, year_end):
    """
    Get columns for BPValue
    e.g. targetted columns:
        - Value ($000) 2022 Adjusted
        - ODP 2022 Adjusted
        - MT 2022 for HFC Adjusted

    @param df: dataframe
    @param year_start: start year
    @param year_end: end year

    @return: dict of columns
    structure:
    {
        year: {
            usd: column name,
            odp: column name,
            mt: column name,
        }
    }
    """
    columns_dict = {}
    for year in range(year_start, year_end + 10):
        columns_dict[year] = {
            "usd": None,
            "odp": None,
            "mt": None,
        }
        for column in df.columns:
            if (str(year) in column and "after" not in column.lower()) or (
                str(year - 1) in column and "after" in column.lower()
            ):
                if "$000" in column:
                    columns_dict[year]["usd"] = column
                elif "ODP" in column:
                    columns_dict[year]["odp"] = column
                elif "MT" in column:
                    columns_dict[year]["mt"] = column
        if not any(columns_dict[year].values()):
            columns_dict.pop(year)

    return columns_dict


def rename_columns(df):
    """
    Rename data frame columns

    @param df: dataframe

    @return: dataframe
    """

    columns = {}
    for column in df.columns:
        if "reason for exceeding" in column.lower():
            columns[column] = "Reason for exceeding"
        elif "chemical detail" in column.lower():
            columns[column] = "Chemical detail"
        elif "required by model" in column.lower():
            columns[column] = "Required by Model"

    df = df.rename(
        columns=columns,
    )

    return df


def get_sector_subsector(sector_subsector, index_row):
    """
    Parse sector and subsector string and get sector and subsector objects

    @param sector_subsector: sector and subsector string

    @return: tuple(sector object, subsector object)
    """

    if not sector_subsector:
        logger.warning(f"[row: {index_row}]: Missing sector and subsector")
        return None, None

    # check if we have a mapping for this string
    if sector_subsector in BP_SECTOR_SUBSECTOR_MAPPING:
        sector_name = BP_SECTOR_SUBSECTOR_MAPPING[sector_subsector]["sector"]
        subsector_name = BP_SECTOR_SUBSECTOR_MAPPING[sector_subsector]["subsector"]
    else:
        # get sector name
        sector_name_re = re.search(SECTOR_REGEX, sector_subsector)
        sector_name_str = (
            sector_name_re.group("sector").strip()
            if sector_name_re
            else sector_subsector
        )
        sector_name = SECTOR_NAME_MAPPING.get(sector_name_str, sector_name_str)

        # get subsector name
        subsector_name_re = re.search(SUBSECTOR_REGEX, sector_subsector)
        subsector_name = (
            subsector_name_re.group("subsector").strip()
            if subsector_name_re
            else sector_subsector
        )

    # get sector and subsector objects
    sector, subsector = get_sector_subsector_details(
        sector_name, subsector_name, index_row
    )

    return sector, subsector


def get_or_create_bp(row, index_row, start_year, end_year):
    """
    Get or create BusinessPlan object

    @param row: dataframe row
    @param index_row: int (row index)
    @param start_year: int (start year)
    @param end_year: int (end year)

    @return: BusinessPlan object or None
    """
    agency = get_object_by_name(
        Agency, row["Agency"], index_row, "agency", use_offset=False
    )
    if not agency:
        logger.warning(
            f"[row: {index_row}]: Missing agency: {row['Agency']} => business plan not created"
        )
        return None

    bp_data = {
        "agency": agency,
        "year_start": start_year,
        "year_end": end_year,
        "status": BusinessPlan.Status.submitted,
    }

    bp, _ = BusinessPlan.objects.update_or_create(
        agency=agency,
        year_start=start_year,
        year_end=end_year,
        defaults=bp_data,
    )

    return bp


def create_business_plan(row, index_row, year_start, year_end):
    """
    Create BusinessPlan object
    @param row: row data
    @param index_row: row index
    @param year_start: start year
    @param year_end: end year

    @return: BusinessPlan object or None
    """
    country = get_country_by_name(row["Country"], index_row, use_offset=False)
    project_type = get_project_type_by_code(row["Type"], index_row)

    # skip project with missing data
    if not all([country, project_type]):
        logger.warning(
            f"[row: {index_row}]: Missing required data (country or project_type))"
            " => business plan activity not created"
        )
        return None

    # get or create business plan
    bp = get_or_create_bp(row, index_row, year_start, year_end)
    if not bp:
        # business plan not created
        return None

    bp_chemical_type = get_or_create_bp_chemical_type(row["Chemical"])
    if not bp_chemical_type:
        logger.warning(
            f"[row: {index_row}]: Missing chemical type: {row['Chemical']} "
            "=> business plan activity not created"
        )
        return None

    sector, subsector = get_sector_subsector(row["Sector and Subsector"], index_row)

    # create business plan data
    bp_activity_data = {
        "business_plan": bp,
        "title": row["Title"] if row["Title"] else "Undefined",
        "required_by_model": row.get("Required by Model"),
        "country": country,
        "lvc_status": row["HCFC Status"] if row["HCFC Status"] else "Undefined",
        "project_type": project_type,
        "legacy_project_type": row["Type"],
        "bp_chemical_type": bp_chemical_type,
        "amount_polyol": get_decimal_from_excel_string(
            row["Amount of Polyol in Project (MT)"]
        ),
        "sector": sector,
        "subsector": subsector,
        "legacy_sector_and_subsector": row["Sector and Subsector"],
        "status": row["A-Appr. P-Plan'd"] if row["A-Appr. P-Plan'd"] else "U",
        "is_multi_year": row["I-Indiv M-MY"] == "M",
        "reason_for_exceeding": row["Reason for exceeding"],
        "remarks": row["Remarks"],
        "remarks_additional": row["Remarks (Additional)"],
    }

    bp_activity, _ = BPActivity.objects.update_or_create(
        business_plan=bp,
        title=bp_activity_data["title"],
        country=bp_activity_data["country"],
        defaults=bp_activity_data,
    )

    return bp_activity


def add_business_plan_values(bp_activity, row, columns_dict):
    """
    Add business plan values

    @param business_plan: BusinessPlan object
    @param row: row data
    @param columns_dict: dict of columns
    """

    values = []
    for year, columns in columns_dict.items():
        value_data = {}
        # set values
        for value_type in ["usd", "odp", "mt"]:
            column_name = columns.get(value_type)
            if not column_name or not row[column_name]:
                continue
            value_data[f"value_{value_type}"] = get_decimal_from_excel_string(
                row[column_name]
            )

        if not value_data:
            continue
        value_data.update(
            {
                "bp_activity_id": bp_activity.id,
                "year": year,
            }
        )
        values.append(BPActivityValue(**value_data))

    BPActivityValue.objects.bulk_create(values, batch_size=1000)


def add_chemicals(bp_activity, row, index_row):
    """
    Add chemicals to business plan

    @param bp_activity: BPActivity object
    @param row: row data
    @param index_row: row index
    """
    if not row["Chemical detail"]:
        return

    chemicals = row["Chemical detail"].split("/")
    substances = []
    for chemical_name in chemicals:
        chemical, ch_type = get_chemical_by_name_or_components(chemical_name)
        if not chemical:
            logger.warning(
                f"[row: {index_row}]: "
                f"Missing chemical: {chemical_name} ({chemicals})"
            )
            continue
        if ch_type == "substance":
            substances.append(chemical)

    bp_activity.substances.add(*substances)


def parse_file(file_path, file_name):
    """
    Parse file and create business plans

    @param file_path: file path
    @param file_name: file name
    """

    # get prerequisites data
    year_start, year_end = re.search(YEAR_REGEX, file_name).groups()
    year_start, year_end = int(year_start), int(year_end)
    sheet_name = f"{year_start}-{year_end}AdjustedBusinessPlan"

    df = pd.read_excel(file_path, dtype=str, sheet_name=sheet_name).replace(
        {np.nan: None}
    )
    df = rename_columns(df)
    year_columns_dict = get_values_columns(df, year_start, year_end)

    for index_row, row in df.iterrows():
        bp = create_business_plan(row, index_row, year_start, year_end)
        if not bp:
            continue
        add_business_plan_values(bp, row, year_columns_dict)
        add_chemicals(bp, row, index_row)


@transaction.atomic
def import_business_plans():
    dir_path = settings.IMPORT_DATA_DIR / "business_plans"

    for file in dir_path.glob("*.xls"):
        file_name = os.fsdecode(file)
        file_path = dir_path / file_name
        if file_name.endswith(".xls"):
            logger.info(f"⏳ importing business plan {file_name}")
            parse_file(file_path, file_name)
            logger.info(f"✔ business plan {file_name} imported")
