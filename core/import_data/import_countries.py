import logging
import pandas as pd

from django.db import transaction
from django.conf import settings

from core.models import Country

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
    df = pd.read_excel(file_path, names=["country", "status"])
    for _, row in df.iterrows():
        country_lvc[row["country"]] = row["status"].lower() == "lvc"

    return country_lvc


@transaction.atomic
def parse_countries_csv(file_path, country_lvc):
    """
    Import countries from file
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)

    @param file_path = str (file path for import file)
    @param country_lvc = dict
        - struct: {country_name: bool}
        - if a country is lvc then the value for country name key will be True

    """
    df = pd.read_csv(file_path)
    for _, row in df.iterrows():
        country_data = {
            "name": row["Country"],
            "iso3": row["ISO3"],
            "m49": row["M49"] if not pd.isna(row["M49"]) else None,
            "is_lvc": country_lvc.get(row["Country"], False),
        }

        Country.objects.update_or_create(
            name=country_data["name"],
            defaults=country_data,
        )


def import_countries():
    country_lvc = parse_country_lvc_file(
        settings.IMPORT_DATA_DIR / "CountryClassification-LVC-Non-LVC.xlsx"
    )
    logger.info("✔ lvc clasification file parsed")

    parse_countries_csv(settings.IMPORT_DATA_DIR / "countries.csv", country_lvc)
    logger.info("✔ countries imported")
