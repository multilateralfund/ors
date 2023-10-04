import logging
import numpy as np
import pandas as pd

from django.conf import settings
from django.db import transaction
from core.import_data.utils import get_chemical
from core.models.blend import Blend

from core.models.substance import Substance


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
        chemical_name = row["chemical"].strip()
        if not chemical_name:
            continue

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


def parse_file(file_path):
    sectiona = pd.read_excel(
        file_path, sheet_name="Section A", usecols=[0], names=["chemical"], skiprows=8
    ).replace({np.nan: None})
    sectionb = pd.read_excel(
        file_path, sheet_name="Section B", usecols=[0], names=["chemical"], skiprows=8
    ).replace({np.nan: None})

    set_chemicals_displayed_status(sectiona)
    set_chemicals_displayed_status(sectionb)


@transaction.atomic
def import_cp_format():
    logger.info("⏳ importing country programme report format")
    file_path = settings.IMPORT_DATA_DIR / "cp_format" / "CP_Format_2022.xls"

    reset_old_format()
    parse_file(file_path)

    logger.info("✔ country programme report format imported")
