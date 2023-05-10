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


def get_country(country_data):
    """
    Get country by name or full name
    @param country_data = dict
    @return country = Country object or None
    """
    country = Country.objects.get_by_name(country_data["name"])
    if country:
        return country

    if country_data.get("full_name"):
        country = Country.objects.get_by_name(country_data["full_name"])

    return country


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

    country = get_country(country_data)

    # update or create country
    if country:
        # remove name from country_data to avoid update name
        country_data.pop("name")
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

    with open(file_path, "r", encoding="utf-8") as f:
        json_data = json.load(f)

    for country_json in json_data:
        if country_json["pk"] != country_json["fields"]["parent_party"]:
            # skip unwanted territories
            continue

        subregion = Subregion.objects.filter(
            import_id=country_json["fields"]["subregion"]
        ).first()

        country_data = {
            "ozone_id": country_json["pk"],
            "name": country_json["fields"]["name"],
            "abbr": country_json["fields"]["abbr"],
            "iso3": country_json["fields"]["iso_alpha3_code"],
            "abbr_alt": country_json["fields"]["abbr_alt"],
            "name_alt": country_json["fields"]["name_alt"],
            "subregion": subregion,
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

        # get subregion
        subregion = Subregion.objects.get_by_name(row["SUBREGION"]).first()

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


def parse_regions_file(file_path):
    """
    Parse regions json file and import regions
    @param file_path string
    """
    with open(file_path, "r", encoding="utf-8") as f:
        json_data = json.load(f)

    for region_json in json_data:
        region_data = {
            "name": region_json["name"],
            "abbr": region_json["abbr"],
        }
        Region.objects.get_or_create(
            name=region_data["name"],
            defaults=region_data,
        )


def parse_subregions_file(file_path):
    """
    Parse subregions json file and import subregions
    @param file_path string
    """
    with open(file_path, "r", encoding="utf-8") as f:
        json_data = json.load(f)

    for subregion_json in json_data:
        region = Region.objects.get_by_name(subregion_json["region"]).first()
        subregion_data = {
            "name": subregion_json["name"],
            "abbr": subregion_json["abbr"],
            "import_id": subregion_json["pk"],
            "region": region,
        }
        Subregion.objects.get_or_create(
            name=subregion_data["name"],
            defaults=subregion_data,
        )


@transaction.atomic
def import_countries():
    country_lvc = parse_country_lvc_file(
        settings.IMPORT_RESOURCES_DIR / "countries_lvc.xlsx"
    )
    logger.info("✔ lvc clasification file parse")
    parse_regions_file(settings.IMPORT_RESOURCES_DIR / "regions.json")
    logger.info("✔ regions imported")
    parse_subregions_file(settings.IMPORT_RESOURCES_DIR / "subregions.json")
    logger.info("✔ subregions imported")
    parse_countries_json_file(
        settings.IMPORT_RESOURCES_DIR / "countries.json", country_lvc
    )
    logger.info("✔ countries json parsed")
    parse_countries_xlsx_file(
        settings.IMPORT_RESOURCES_DIR / "countries.xlsx", country_lvc
    )
    logger.info("✔ countries xlsx parsed")
