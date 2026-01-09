import logging
import pandas as pd

from django.db import transaction

from core.models.base import Module
from core.models.country import Country
from core.import_data.utils import (
    IMPORT_RESOURCES_V2_DIR,
)

logger = logging.getLogger(__name__)


@transaction.atomic
def clean_up_countries():
    """
    Clean up country names
    Set modules for countries
    """
    # clean up country names
    country_name_corrections = {
        "Bolivia (Plurinational State of)": "Bolivia",
        "Cabo Verde": "Cape Verde",
        "Côte d'Ivoire": "Cote D'Ivoire",
        "Syrian Arab Republic": "Syria",
        "Timor-Leste": "Timor Leste",
        "Viet Nam": "Vietnam",
        "Venezuela (Bolivarian Republic of)": "Venezuela",
        "Türkiye": "Turkey",
        "United Republic of Tanzania": "Tanzania",
        "Iran (Islamic Republic of)": "Iran",
        "Guinea Bissau": "Guinea-Bissau",
        "Micronesia (Federated States of)": "Micronesia",
    }

    # for old_name, new_name in country_name_corrections.items():
    #     country = Country.objects.filter(name=old_name).first()
    #     if country:
    #         country.name = new_name
    #         country.save()
    #         logger.info(f"✔ Country name updated from '{old_name}' to '{new_name}'")

    # set modules for countries
    projects_module = Module.objects.filter(code="Projects").first()
    business_plans_module = Module.objects.filter(code="BP").first()
    file_path = IMPORT_RESOURCES_V2_DIR / "countries" / "MLF Countries and Regions.xlsx"
    df = pd.read_excel(file_path).fillna("")

    for _, row in df.iterrows():
        country = Country.objects.find_by_name(row["Countries"])
        if not country:
            logger.warning(f"⚠️ Country '{row['Countries']}' not found")
            continue
        country.modules.clear()
        country.modules.add(projects_module)
        country.modules.add(business_plans_module)
        country.save()
