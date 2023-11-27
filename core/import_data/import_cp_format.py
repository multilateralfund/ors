import logging
import numpy as np
import pandas as pd

from django.conf import settings
from django.db import transaction
from core.import_data.utils import IMPORT_RESOURCES_DIR, delete_old_data, get_chemical
from core.models.blend import Blend
from core.models.country_programme import CPReportFormat

from core.models.substance import Substance
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
]


def reset_old_format():
    Substance.objects.update(displayed_in_all=False, displayed_in_latest_format=False)
    Blend.objects.update(displayed_in_all=False, displayed_in_latest_format=False)


def set_chemicals_displayed_status(df):
    for index_row, row in df.iterrows():
        chemical_name = row["chemical"]
        if not chemical_name:
            continue
        chemical_name = chemical_name.strip()

        # skip some chemical names that are not real chemicals
        skip_found = [
            skip_name
            for skip_name in SKIP_CHEMICAL_NAMES
            if skip_name in chemical_name.lower()
        ]
        if skip_found:
            continue

        # parse chemical name
        substance, blend = get_chemical(chemical_name, index_row)
        chemical = substance or blend
        if not chemical:
            continue

        # set displayed status
        chemical.displayed_in_all = True
        chemical.displayed_in_latest_format = True
        chemical.save()


def import_chemicas_format(file_path):
    reset_old_format()

    sectiona = pd.read_excel(
        file_path, sheet_name="Section A", usecols=[0], names=["chemical"], skiprows=8
    ).replace({np.nan: None})
    sectionb = pd.read_excel(
        file_path, sheet_name="Section B", usecols=[0], names=["chemical"], skiprows=8
    ).replace({np.nan: None})

    sectionc = pd.read_excel(
        file_path, sheet_name="Section C", usecols=[0], names=["chemical"], skiprows=4
    ).replace({np.nan: None})

    set_chemicals_displayed_status(sectiona)
    set_chemicals_displayed_status(sectionb)
    set_chemicals_displayed_status(sectionc)


def import_usages_format(file_path):
    # delete old data
    delete_old_data(CPReportFormat)

    df = pd.read_excel(file_path).replace({np.nan: None})

    cp_fomats = []
    for index_row, row in df.iterrows():
        time_frame = TimeFrame.objects.find_by_frame(row["min_year"], row["max_year"])
        if not time_frame:
            logger.warning(
                f"{index_row}: {row['min_year']}-{row['max_year']} time frame not found"
            )
            continue

        usage = Usage.objects.find_by_name(row["usage"])
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
            cp_fomats.append(CPReportFormat(**cp_format_data))

    CPReportFormat.objects.bulk_create(cp_fomats)


@transaction.atomic
def import_cp_format():
    logger.info("⏳ importing country programme report format")
    file_path = settings.IMPORT_DATA_DIR / "cp_format" / "CP_Format_2022.xls"
    import_chemicas_format(file_path)

    file_path = IMPORT_RESOURCES_DIR / "usages_cp_format.xlsx"
    import_usages_format(file_path)

    logger.info("✔ country programme report format imported")
