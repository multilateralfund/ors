import json
import logging
import pandas as pd

from django.db import transaction
from django.db.models import Q
from core.import_data.mapping_names_dict import COUNTRY_NAME_MAPPING
from core.import_data.utils import IMPORT_RESOURCES_DIR

from core.models import Country

logger = logging.getLogger(__name__)

A2_COUNTRY_LIST = [
    "Bulgaria",
    "Canada",
    "Croatia",
    "Estonia",
    "France",
    "Kazakhstan",
    "Romania",
    "Ukraine",
    "United Arab Emirates",
    "United States of America",
    "Yugoslavia",
]


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
    country = Country.objects.find_by_name(country_data["name"])
    if country:
        return country

    if country_data.get("full_name"):
        country = Country.objects.find_by_name(country_data["full_name"])

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
        for attr, value in country_data.items():
            setattr(country, attr, value)
        country.save()
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
        if (
            country_json["pk"] != country_json["fields"]["parent_party"]
            and country_json["fields"]["name"] != "Yugoslavia"
        ):
            # skip unwanted territories
            continue

        subregion = Country.objects.filter(
            import_id=country_json["fields"]["subregion"],
            location_type=Country.LocationType.SUBREGION,
        ).first()

        country_data = {
            "ozone_id": country_json["pk"],
            "name": country_json["fields"]["name"],
            "abbr": country_json["fields"]["abbr"],
            "iso3": country_json["fields"]["iso_alpha3_code"],
            "abbr_alt": country_json["fields"]["abbr_alt"],
            "name_alt": country_json["fields"]["name_alt"],
            "parent": subregion,
            "location_type": Country.LocationType.COUNTRY,
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
        subregion = Country.objects.filter(
            name__iexact=row["SUBREGION"],
            location_type=Country.LocationType.SUBREGION,
        ).first()

        # update country
        country_data = {
            "name": COUNTRY_NAME_MAPPING.get(row["COUNTRY"], row["COUNTRY"]),
            "full_name": COUNTRY_NAME_MAPPING.get(
                row["COUNTRYFULLNAME"], row["COUNTRYFULLNAME"]
            ),
            "ozone_unit": row["OZONE_UNIT"],
            "parent": subregion,
            "location_type": Country.LocationType.COUNTRY,
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
            "name_alt": f"Region: {region_json['abbr']}",
            "full_name": f"Region: {region_json['name']}",
            "location_type": Country.LocationType.REGION,
            "parent_id": None,
        }
        Country.objects.update_or_create(
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
        region = Country.objects.filter(
            name=subregion_json["region"],
            location_type=Country.LocationType.REGION,
        ).first()
        subregion_data = {
            "name": subregion_json["name"],
            "abbr": subregion_json["abbr"],
            "name_alt": subregion_json.get("name_alt"),
            "import_id": subregion_json["pk"],
            "parent": region,
            "location_type": Country.LocationType.SUBREGION,
        }

        if region and region.name == subregion_json["name"]:
            subregion_data["name"] = f"{subregion_data['name']} Subregion"

        Country.objects.update_or_create(
            name=subregion_data["name"],
            location_type=Country.LocationType.SUBREGION,
            defaults=subregion_data,
        )


def parse_consumption_json_files(file_path_categories, file_path_groups):
    """
    Parse consumption json files and update country fields
    @param file_path_categories string
    @param file_path_groups string
    """
    with open(file_path_categories, "r", encoding="utf-8") as f:
        json_data_categories = json.load(f)

    with open(file_path_groups, "r", encoding="utf-8") as f:
        json_data_groups = json.load(f)

    for category, countries in json_data_categories.items():
        Country.objects.filter(
            Q(name__in=countries)
            | Q(full_name__in=countries)
            | Q(name_alt__in=countries)
        ).update(consumption_category=category)

    for group, countries in json_data_groups.items():
        Country.objects.filter(
            Q(name__in=countries)
            | Q(full_name__in=countries)
            | Q(name_alt__in=countries)
        ).update(consumption_group=group)


def set_a2_countries():
    """
    Set A2 countries
    """
    for country_name in A2_COUNTRY_LIST:
        country = Country.objects.find_by_name(country_name)
        if country:
            country.is_a2 = True
            country.save()
        else:
            logger.error(f"Country {country_name} not found => A2 not set")


def reset_regions_subregions(file_path):
    """
    Reset regions and subregions
    """
    df = pd.read_excel(file_path)
    for _, row in df.iterrows():
        country_name = COUNTRY_NAME_MAPPING.get(row["Country"], row["Country"])
        country = Country.objects.find_by_name(country_name)
        subregion = Country.objects.find_by_name_and_type(
            row["A5 Sub-region"], Country.LocationType.SUBREGION
        )

        # "West Asia" subregion is referred to as "West Asia Subregion" in the database
        # to avoid confusion between the subregion and the region.
        if not subregion:
            subregion_name = f"{row['A5 Sub-region']} Subregion"
            subregion = Country.objects.find_by_name(subregion_name)

        if not all([country, subregion]):
            logger.error(f"Country, Region or Subregion not found: {row['Country']}")
            continue

        country.parent = subregion
        country.save()


@transaction.atomic
def import_countries():
    country_lvc = parse_country_lvc_file(IMPORT_RESOURCES_DIR / "countries_lvc.xlsx")
    logger.info("✔ lvc clasification file parse")
    parse_regions_file(IMPORT_RESOURCES_DIR / "regions.json")
    logger.info("✔ regions imported")
    parse_subregions_file(IMPORT_RESOURCES_DIR / "subregions.json")
    logger.info("✔ subregions imported")
    parse_countries_json_file(IMPORT_RESOURCES_DIR / "countries.json", country_lvc)
    logger.info("✔ countries json parsed")
    parse_countries_xlsx_file(IMPORT_RESOURCES_DIR / "countries.xlsx", country_lvc)
    logger.info("✔ countries xlsx parsed")
    parse_consumption_json_files(
        IMPORT_RESOURCES_DIR / "country_consumption_categories.json",
        IMPORT_RESOURCES_DIR / "country_consumption_groups.json",
    )
    logger.info("✔ countries consumption files parsed")

    reset_regions_subregions(IMPORT_RESOURCES_DIR / "regions_and_countries.xlsx")
    logger.info("✔ regions and subregions reset")
    set_a2_countries()
