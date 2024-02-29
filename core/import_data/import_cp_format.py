import logging
import numpy as np
import pandas as pd

from django.conf import settings
from django.db import transaction
from core.import_data.utils import IMPORT_RESOURCES_DIR, delete_old_data, get_chemical
from core.models.country_programme import CPReportFormatColumn, CPReportFormatRow

from core.models.time_frame import TimeFrame
from core.models.usage import Usage


logger = logging.getLogger(__name__)

SKIP_CHEMICAL_NAMES = [
    "total",
    "other",
    "annex",
    "where the data",
    "indicate relevant",
    "blends (mixtured",
    "when reporting",
    "if a non-standard blend",
    "tentative/best estimates",
    "these substances are not",
    "hcfcs",
    "hfcs",
    "alternatives",
    "controlled substances",
    "where applicable",
    "indicate whether",
    "*  qps =",
    "number of",
    "estimated",
    "training programmes",
    "export quotas",
]

FILE_DATA_MAPPING = {
    "CP_Format_2005_2011.xls": {
        "sheets": {
            "Data Sheet": "A",
            "Adm-C": "C",
        },
        "time_frame": {"min_year": 1995, "max_year": 2011},
    },
    "CP_Format_2012_2018.xls": {
        "sheets": {
            "Data Sheet": "A",
            "Adm-C": "C",
        },
        "time_frame": {"min_year": 2012, "max_year": 2018},
    },
    "CP_Format_2019_2021.xls": {
        "sheets": {
            "Section A": "A",
            "Section B": "B",
            "Section C": "C",
        },
        "time_frame": {"min_year": 2019, "max_year": 2021},
    },
    "CP_Format_2022.xls": {
        "sheets": {
            "Section A": "A",
            "Section B": "B",
            "Section C": "C",
        },
        "time_frame": {"min_year": 2022, "max_year": None},
    },
}


def get_chemical_by_name(chemical_name, index_row):
    """
    Get chemical by name and index row.

    @param chemical_name: chemical name
    @param index_row: index row

    @return: tuple
        (Substance, None) if the chemical is a substance
        (None, Blend) if the chemical is a blend
    """

    if not chemical_name:
        return None, None
    chemical_name = chemical_name.strip()

    # skip some chemical names that are not real chemicals
    skip_found = [
        skip_name
        for skip_name in SKIP_CHEMICAL_NAMES
        if skip_name in chemical_name.lower()
    ]
    if skip_found:
        return None, None

    # parse chemical name
    return get_chemical(chemical_name, index_row)


def set_chemicals_displayed_status(df, time_frame, section):

    # get time frame
    time_frame = TimeFrame.objects.find_by_frame(
        time_frame["min_year"], time_frame["max_year"]
    )
    if not time_frame:
        logger.warning(f"{time_frame} time frame not found")
        return

    # parse data frame
    format_data = {
        "time_frame": time_frame,
        "section": section,
    }

    formats = []
    sort_order = 100
    for index_row, row in df.iterrows():
        chemical_name = row["chemical"]
        substance, blend = get_chemical_by_name(chemical_name, index_row)
        if not substance and not blend:
            continue
        format_data.update(
            {
                "substance": substance,
                "blend": blend,
                "sort_order": sort_order,
            }
        )
        formats.append(CPReportFormatRow(**format_data))
        sort_order += 100

    # create formats
    CPReportFormatRow.objects.bulk_create(formats)


def import_cp_format_row(dir_path):
    delete_old_data(CPReportFormatRow)

    for file, file_data in FILE_DATA_MAPPING.items():
        file_path = dir_path / file

        for sheet, section in file_data["sheets"].items():
            # set skip rows
            sk_rows = 8
            if section == "C":
                if "adm" in sheet.lower():
                    if file == "CP_Format_2005_2011.xls":
                        sk_rows = 47
                    else:
                        sk_rows = 33
                else:
                    sk_rows = 5
            # read data
            df = pd.read_excel(
                file_path,
                sheet_name=sheet,
                usecols=[0],
                names=["chemical"],
                skiprows=sk_rows,
            ).replace({np.nan: None})
            set_chemicals_displayed_status(df, file_data["time_frame"], section)


def import_usages_format(file_path):
    # delete old data
    delete_old_data(CPReportFormatColumn)

    df = pd.read_excel(file_path).replace({np.nan: None})

    cp_fomats = []
    for index_row, row in df.iterrows():
        time_frame = TimeFrame.objects.find_by_frame(row["min_year"], row["max_year"])
        if not time_frame:
            logger.warning(
                f"{index_row}: {row['min_year']}-{row['max_year']} time frame not found"
            )
            continue

        usage = Usage.objects.find_by_full_name(row["usage"])
        if not usage:
            logger.warning(f"{index_row}: {row['usage']} usage not found")
            continue

        sections = row["sections"].split(",")
        for section in sections:
            cp_format_data = {
                "usage": usage,
                "time_frame": time_frame,
                "section": section,
                "sort_order": usage.sort_order,
            }
            cp_fomats.append(CPReportFormatColumn(**cp_format_data))

    CPReportFormatColumn.objects.bulk_create(cp_fomats)


@transaction.atomic
def import_cp_format():
    logger.info("⏳ importing country programme report format")
    dir_path = settings.IMPORT_DATA_DIR / "cp_format"
    import_cp_format_row(dir_path)

    file_path = IMPORT_RESOURCES_DIR / "usages_cp_format.xlsx"
    import_usages_format(file_path)

    logger.info("✔ country programme report format imported")
