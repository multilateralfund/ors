import json
import logging
import pandas as pd

from django.db import transaction
from django.conf import settings

from core.models import Country, Subregion, Region

logger = logging.getLogger(__name__)


COUNTRY_NAME_DICT = {
    "United Arab Emirats": "United Arab Emirates",
}


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


def update_or_create_country(country_data, country_lvc):
    """
    Create country
    @param country_data = dict
    @param country_lvc = dict
    """
    # set lvc data
    if country_data["name"] in country_lvc:
        country_data.update(
            {
                "is_lvc": country_lvc[country_data["name"]]["is_lvc"],
                "lvc_baseline": country_lvc[country_data["name"]]["baseline"],
            }
        )

    # get country
    country = Country.objects.get_by_name(country_data["name"])
    if not country and country_data.get("full_name"):
        country = Country.objects.get_by_name(country_data["full_name"])

    # update or create country
    if country:
        country.update(**country_data)
    else:
        Country.objects.create(**country_data)


def parse_countries_json_file(file_path, country_lvc):
    """
    Parse countries json file and import countries
    @param file_path = str (file path for import file)
    @param country_lvc = dict
        - struct: {country_name: bool}
        - if a country is lvc then the value for country name key will be True
    """

    with open(file_path, "r") as f:
        json_data = json.load(f)

    for country_json in json_data:
        country_data = {
            "ozone_id": country_json["pk"],
            "name": country_json["fields"]["name"],
            "abbr": country_json["fields"]["abbr"],
            "iso3": country_json["fields"]["iso_alpha3_code"],
            "abbr_alt": country_json["fields"]["abbr_alt"],
            "name_alt": country_json["fields"]["name_alt"],
        }
        update_or_create_country(country_data, country_lvc)


def parse_countries_xlsx_file(file_path, country_lvc):
    """
    parse file and get ozone unit for countries
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)

    @param file_path = str (file path for import file)
    """
    df = pd.read_excel(file_path)
    for _, row in df.iterrows():
        if row["CTR_DESCRIPTION"] != "Country":
            continue

        # get or create region and subregion
        region, _ = Region.objects.get_or_create(name=row["REGION"])
        subregion, _ = Subregion.objects.get_or_create(
            name=row["SUBREGION"],
            defaults={"name": row["SUBREGION"], "region_id": region.id},
        )

        # update country
        country_data = {
            "name": COUNTRY_NAME_DICT.get(row["COUNTRY"], row["COUNTRY"]),
            "full_name": COUNTRY_NAME_DICT.get(
                row["COUNTRYFULLNAME"], row["COUNTRYFULLNAME"]
            ),
            "ozone_unit": row["OZONE_UNIT"],
            "subregion": subregion,
        }
        update_or_create_country(country_data, country_lvc)


@transaction.atomic
def import_countries():
    country_lvc = parse_country_lvc_file(
        settings.IMPORT_RESOURCES_DIR / "countries_lvc.xlsx"
    )
    logger.info("✔ lvc clasification file parsed")
    parse_countries_json_file(
        settings.IMPORT_RESOURCES_DIR / "parties.json", country_lvc
    )
    logger.info("✔ countries json parsed")
    parse_countries_xlsx_file(
        settings.IMPORT_RESOURCES_DIR / "countries.xlsx", country_lvc
    )
    logger.info("✔ countries xlsx parsed")
