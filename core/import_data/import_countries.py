import json
import logging
import pandas as pd

from django.db import transaction
from django.conf import settings

from core.models import Country, Subregion, Region

logger = logging.getLogger(__name__)

REGION_NAME_DICT = {
    "Asia and Pacific": "Asia-Pacific",
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


def parse_regions_file(file_path):
    """
    Parse regions file
    @param file_path = str (file path for import file)
    """
    with open(file_path, "r") as f:
        json_data = json.load(f)

    for region_json in json_data:
        region_data = {
            "ozone_id": region_json["pk"],
            "name": region_json["fields"]["name"],
            "abbr": region_json["fields"]["abbr"],
        }
        Region.objects.update_or_create(name=region_data["name"], defaults=region_data)


def parse_subregions_file(file_path):
    """
    Parse subregions file
    @param file_path = str (file path for import file)
    """
    with open(file_path, "r") as f:
        json_data = json.load(f)

    for subregion_json in json_data:
        region = Region.objects.filter(
            ozone_id=subregion_json["fields"]["region"]
        ).first()
        subregion_data = {
            "ozone_id": subregion_json["pk"],
            "name": subregion_json["fields"]["name"],
            "abbr": subregion_json["fields"]["abbr"],
            "region": region,
        }
        Subregion.objects.update_or_create(
            name=subregion_data["name"], defaults=subregion_data
        )


def create_country(country_data, country_lvc):
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

    # create country
    Country.objects.update_or_create(name=country_data["name"], defaults=country_data)


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
        subregion = Subregion.objects.filter(
            ozone_id=country_json["fields"]["subregion"]
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
        create_country(country_data, country_lvc)


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
        country = Country.objects.filter(name=row["COUNTRY"]).first()

        # create country if not exists
        if not country:
            # get or create region and subregion
            region_name = REGION_NAME_DICT.get(row["REGION"], row["REGION"])
            region, _ = Region.objects.get_or_create(name=region_name)
            subregion, _ = Subregion.objects.get_or_create(
                name=row["SUBREGION"],
                defaults={"name": row["SUBREGION"], "region_id": region.id},
            )
            # create country
            country_data = {
                "name": row["COUNTRY"],
                "iso3": row["CTR"],
                "full_name": row["COUNTRYFULLNAME"],
                "ozone_unit": row["OZONE_UNIT"],
                "subregion": subregion,
            }
            create_country(country_data, country_lvc)
        else:
            # update ozone unit if the country exists
            country.ozone_unit = row["OZONE_UNIT"]
            country.save()


@transaction.atomic
def import_countries():
    country_lvc = parse_country_lvc_file(
        settings.IMPORT_RESOURCES_DIR / "countries_lvc.xlsx"
    )
    logger.info("✔ lvc clasification file parsed")
    parse_regions_file(settings.IMPORT_RESOURCES_DIR / "regions.json")
    logger.info("✔ regions imported")
    parse_subregions_file(settings.IMPORT_RESOURCES_DIR / "subregions.json")
    logger.info("✔ subregions imported")
    parse_countries_json_file(
        settings.IMPORT_RESOURCES_DIR / "parties.json", country_lvc
    )
    logger.info("✔ countries json parsed")
    parse_countries_xlsx_file(
        settings.IMPORT_RESOURCES_DIR / "countries.xlsx", country_lvc
    )
    logger.info("✔ countries xlsx parsed")
