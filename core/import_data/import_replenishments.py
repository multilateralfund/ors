import logging
from decimal import Decimal

import pandas as pd

from core.models import Replenishment, Country, Contribution
from core.import_data.utils import (
    IMPORT_RESOURCES_DIR,
    delete_old_data,
    decimal_converter,
)

logger = logging.getLogger(__name__)

# TODO: 2021-2023
REPLENISHMENT_YEARS = [(2024, 2026)]


def import_replenishments():
    """
    Import past replenishments (2024-2026).
    """
    delete_old_data(Contribution)
    delete_old_data(Replenishment)

    countries = {country.name: country for country in Country.objects.all()}
