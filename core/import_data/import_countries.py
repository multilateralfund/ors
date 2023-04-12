import logging
import pandas as pd

from django.db import transaction
from django.conf import settings

from core.models import Country, Subregion, Region

logger = logging.getLogger(__name__)


def parse_country_lvc_file(file_path):
    """
    Parse country lvc file
    @param file_path = str (file path for import file)

    @return country_lvc = dict
        - struct: {country_name: bool}
        - if a country is lvc then the value for country name key will be True
    """
    country_lvc = {}
    df = pd.read_excel(file_path)
    for _, row in df.iterrows():
        country_lvc[row["Country"]] = {
            "is_lvc": row["CountryCategory"].lower() == "lvc",
            "baseline": row["Baseline"],
        }

    return country_lvc


@transaction.atomic
def parse_countries_xlsx(file_path, country_lvc):
    """
    Import countries from file
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)

    @param file_path = str (file path for import file)
    @param country_lvc = dict
        - struct: {country_name: bool}
        - if a country is lvc then the value for country name key will be True

    """
    df = pd.read_excel(file_path)
    for _, row in df.iterrows():
        region, _ = Region.objects.get_or_create(name=row["REGION"])
        subregion, _ = Subregion.objects.get_or_create(
            name=row["SUBREGION"],
            region_id=region.id,
        )
        country_data = {
            "name": row["COUNTRY"],
            "iso3": row["CTR"],
            "full_name": row["COUNTRYFULLNAME"],
            "ozone_unit": row["OZONE_UNIT"],
            "subregion_id": subregion.id,
        }
        if row["COUNTRY"] in country_lvc:
            country_data.update(
                {
                    "is_lvc": country_lvc[row["COUNTRY"]]["is_lvc"],
                    "lvc_baseline": country_lvc[row["COUNTRY"]]["baseline"],
                }
            )

        Country.objects.update_or_create(
            name=country_data["name"],
            defaults=country_data,
        )


def import_countries():
    country_lvc = parse_country_lvc_file(
        settings.IMPORT_DATA_DIR / "tbCountryLVCNonLVCHCFC.xlsx"
    )
    logger.info("✔ lvc clasification file parsed")

    parse_countries_xlsx(settings.IMPORT_DATA_DIR / "countries.xlsx", country_lvc)
    logger.info("✔ countries imported")
