import decimal
import json
import re

from django.conf import settings

from core.models.adm import AdmColumn, AdmRow
from core.models.blend import Blend
from core.models.country import Country
from core.models.country_programme import CPReport
from core.models.substance import Substance
from core.utils import IMPORT_DB_MAX_YEAR

IMPORT_RESOURCES_DIR = settings.ROOT_DIR / "import_data" / "resources"
IMPORT_PROJECTS_DIR = settings.ROOT_DIR / "import_data" / "project_database"

# When we parse excel files, "index_row" is two steps behind. Because of this, the
# excel files are hard to check.
# Used only for logs.
OFFSET = 2

# --- mapping dictionaries ---
COUNTRY_NAME_MAPPING = {
    "Brunei Darussalan": "Brunei Darussalam",
    "Cap Verde": "Cabo Verde",
    "Czech Republic": "Czechia",
    "Eswatini (the Kingdom of)": "Eswatini",
    "Federated States of Micronesia": "Micronesia (Federated States of)",
    "Lao, PDR": "Lao PDR",
    "SAO TOME ET PRINCIPE": "Sao Tome and Principe",
    "Turkiye": "Turkey",
    "USA": "United States of America",
    "Western Samoa": "Samoa",
}

SUBSECTOR_NAME_MAPPING = {
    "HFC phase-down plan": "HFC phase down plan",
}

USAGE_NAME_MAPPING = {
    "Aerosal": "Aerosol",
    "FireFighting": "Fire fighting",
    "ProcessAgent": "Process agent",
    "LabUse": "Lab use",
    "NoneQPS": "Non-QPS",
    "TobaccoFluffing": "Tobacco fluffing",
}

CHEMICAL_NAME_MAPPING = {
    "R-125 (65.1%), R-134a  -  (31.5%)": "R-422D",
    "HFC-365mfc (93%)/HFC-227ea (7%) - mezcla": "CustMix-134",
}

DB_YEAR_MAPPING = {
    "CP": {
        "min_year": 2000,
        "max_year": 2011,
    },
    "CP2012": {
        "min_year": 2012,
        "max_year": 2018,
    },
}

# --- list of db names ---
DB_DIR_LIST = ["CP", "CP2012"]


# --- list of country names that can be skipped ---
SKIP_COUNTRY_LIST = [
    "global",
    "zaire",
]

# "R-404A (HFC-125=44%, HFC-134a=4%, HFC-143a=52%)" => [("HFC-125", "44"), ("HFC-134a", "4"), ("HFC-143a", "52")]
BLEND_COMPONENTS_RE = r"(\w{1,4}\-?\s?\w{2,7})\s?=?-?\s?\(?(\d{1,3}\.?\,?\d{,3})\%\)?"
# "R23/R125/CO2/HFO-1132 (10%/10%/60%/20%)"
BLEND_COMPOSITION_RE = r"((/[a-zA-Z0-9/-]{3,15})+\s?\(\d{1,3}\.?\,?\d{,2}?%)"

# this will find if the value is one of the excel annomally
# where the value of the floating point calculation is not accurate
# e.g. 1.252795 => 1.2527949999999999;
# e.g. 3143.32 ==> 3143.320000000001
EXCEL_BUG_RE = r"[09]{5,}\d$"


# --- import utils ---


def parse_string(string_value):
    """
    remove white spaces and convert to lower case
    """
    if not string_value:
        return None

    return string_value.strip().lower()


def delete_old_data(cls, source_file, logger):
    """
    Delete old data from db for a specific source file

    @param cls: Class instance
    @param source_file: string source file name
    @param logger: logger object
    """
    cls.objects.filter(source_file__iexact=str(source_file).lower()).all().delete()
    logger.info(f"✔ old {cls.__name__} from {source_file} deleted")


def get_chemical_by_name_or_components(chemical_name, components=None):
    """
    get chemical by name or alt name (case insensitive) or components (blends)
    @param chemical_name: string chemical name
    @param components: list of tuples (substance_name, percentage) (for blends)

    @return: tuple(object, string) (substance | blend, chemical_type)
    """
    if not chemical_name:
        return None, None

    substance = Substance.objects.find_by_name(chemical_name)
    if substance:
        return substance, "substance"

    blend = Blend.objects.find_by_name_or_components(chemical_name, components)
    if blend:
        return blend, "blend"

    return None, None


def get_cp_report(
    year, country_name, country_id=None, index_row=None, logger=None, other_args=None
):
    """
    get or create country program report object by year and country
    @param year = int
    @param country_name = string
    @param country_id = int
    @param index_row = int
    @param logger = logger obj
    @param other_args = dict (other arguments for CPReport object)

    @return country_program = CPReport object
    """
    if not country_id:
        country = get_country_by_name(country_name, index_row, logger)
        country_id = country.id

    cp_name = f"{country_name} {year}"
    data = {
        "name": cp_name,
        "year": year,
        "country_id": country_id,
    }
    if other_args:
        data.update(other_args)

    cp, _ = CPReport.objects.update_or_create(
        name=cp_name, year=year, country_id=country_id, defaults=data
    )

    return cp


def get_object_by_name(cls, obj_name, index_row, obj_type_name, logger):
    """
    get object by name or log error if not found in db
    @param cls: Class instance
    @param obj_name: string -> object name (filter value)
    @param index_row: integer -> index row
    @param obj_type_name: string -> object type name (for logging)
    @param logger: logger object

    @return: object or None
    """
    if not obj_name:
        return None
    obj = cls.objects.find_by_name(obj_name)

    if not obj:
        logger.info(
            f"[row: {index_row + OFFSET}]: This {obj_type_name} does not exists in data base: {obj_name}"
        )

    return obj


# --- cp databases import utils ---
def get_adm_column(column_name, section, logger):
    column = AdmColumn.objects.filter(name=column_name, section=section).first()
    if not column:
        logger.error(
            f"Column {column_name} not found. "
            "Make sure that you imported adm columns "
            "(check import resources from import_docs.md)"
        )
        return None

    return column


def get_or_create_adm_row(row_data):
    """
    get or create adm row object
        - if the row exists in db, update min_year and max_year
        - if the row doesn't exist in db, create it
    @param row_data = dict (row data)

    @return AdmRow object
    """
    existing_row = AdmRow.objects.filter(
        text=row_data["text"],
        section=row_data["section"],
        country_programme_report_id=row_data.get("country_programme_report_id", None),
    ).first()

    if existing_row:
        existing_row.min_year = min(existing_row.min_year, row_data["min_year"])
        existing_row.max_year = max(existing_row.max_year, row_data["max_year"])
        existing_row.save()
        return existing_row

    return AdmRow.objects.create(**row_data)


def get_cp_report_for_db_import(
    year_dict, country_dict, json_entry, logger, entry_id, other_args=None
):
    """
    get or create country program report object by year and country
    @param year_dict = dict
    @param country_dict = dict
    @param json_entry = dict (json entry)
    @param logger = logger object
    @param entry_id = int
    @param other_args = dict (other arguments for CPReport object)

    @return country_program = CPReport object
    """

    # check if year and country
    if json_entry["ProjectDateId"] not in year_dict:
        logger.warning(
            f"Year not found: {json_entry['ProjectDateId']} (EntryID: {entry_id})"
        )
        return None

    # skip years greater than DB_MAX_YEAR
    year = year_dict[json_entry["ProjectDateId"]]
    if year > IMPORT_DB_MAX_YEAR:
        return None

    if json_entry["CountryId"] not in country_dict:
        logger.warning(
            f"Country not found: {json_entry['CountryId']} (EntryID: {entry_id})"
        )
        return None

    year = year_dict[json_entry["ProjectDateId"]]
    country = country_dict[json_entry["CountryId"]]

    # skip test country
    if country["name"] == "test":
        return None

    # get cp report id
    cp_report = get_cp_report(
        year, country["name"], country["id"], other_args=other_args
    )
    return cp_report


def get_country_and_year_dict(dir_path, logger):
    """
    Parse country and year json files and create dictionaries
    @param country_file = str (file path for country import file)
    @param year_file = str (file path for year import file)
    @param logger = logger object

    @return tuple(country_dict, year_dict) = tuple(dict, dict)
        - struct: country_dict = {
            country_cp_id: {
                "id": county_id,
                "name": country_name
            }
        }
        - struct: year_dict = {year_cp_id: year}
    """
    country_file = dir_path / "Country.json"
    country_dict = get_country_dict_from_db_file(country_file, logger)
    logger.info("✔ country file parsed")

    year_file = dir_path / "ProjectYear.json"
    year_dict = get_year_dict_from_db_file(year_file)
    logger.info("✔ year file parsed")

    return country_dict, year_dict


def get_country_dict_from_db_file(file_name, logger):
    """
    Parse country json file and create a dictionary
    @param file_name = str (file path for import file)

    @return country_dict = dict
        - struct: {
            country_cp_id: {
                "id": county_id,
                "name": country_name
            }
        }
    """
    country_dict = {}
    with open(file_name, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for country_json in json_data:
        country_name = COUNTRY_NAME_MAPPING.get(
            country_json["Country"].strip(), country_json["Country"]
        )

        # skip countries
        if country_name.lower() in SKIP_COUNTRY_LIST:
            continue

        if "test" in country_name.lower() or "article 5" in country_name.lower():
            # set test countries to be skipped in the future
            country_dict[country_json["CountryId"]] = {
                "id": None,
                "name": "test",
            }
            continue

        country = Country.objects.find_by_name(country_name)
        if not country:
            logger.warning(
                f"Country not found: {country_json['Country']} "
                f"(CountryId: {country_json['CountryId']})",
            )
            continue

        country_dict[country_json["CountryId"]] = {
            "id": country.id,
            "name": country.name,
        }

    # add test country with id = 0
    country_dict[0] = {
        "id": None,
        "name": "test",
    }

    return country_dict


def get_year_dict_from_db_file(file_name):
    """
    Parse year json file and create a dictionary
    @param file_name = str (file path for import file)

    @return year_dict = dict
        - struct: {year_cp_id: year}
    """
    year_dict = {}
    with open(file_name, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for year_json in json_data:
        year_dict[year_json["ProjectDateId"]] = year_json["ProjectDate"]

    return year_dict


# --- xlsx import utils ---
def get_decimal_from_excel_string(string_value):
    """
    get decimal from string
    """
    if not string_value:
        return None

    try:
        decimal_value = decimal.Decimal(string_value)
        # check if the value is one of the excel annomally
        if re.search(EXCEL_BUG_RE, string_value):
            # round the value to 11 digits to avoid the excel annomally
            decimal_value = round(decimal_value, 11)
        return decimal_value
    except decimal.InvalidOperation:
        return None


def check_headers(df, required_columns, logger):
    """
    check if the df has all the required columns
    @param df = pandas dataFrame
    @param required_columns = list
    @param logger = logger object

    @return boolean
    """
    for c in required_columns:
        if c not in df.columns:
            logger.error("Invalid column list.")
            logger.warning(f"The following columns are required: {required_columns}")
            return False
    return True


def check_empty_row(row, index_row, quantity_columns, logger):
    """
    check if the row has negative values and if it's empty
    @param row = pandas series
    @param index_row = int
    @param usage_dict = dict (column_name: Usage obj)

    @return boolean (True if the row is empty)
    """
    # check if the row is empty
    is_empty = True
    negative_values = []
    for colummn_name in quantity_columns:
        if row.get(colummn_name, None):
            is_empty = False
            # check if the value is negative
            if isinstance(row[colummn_name], (int, float)) and row[colummn_name] < 0:
                negative_values.append(colummn_name)
    # log negative values
    if negative_values:
        logger.warning(
            f"⚠️ [row: {index_row + OFFSET}] "
            f"The following columns have negative values: {negative_values}"
        )
    return is_empty


def parse_chemical_name(chemical_name):
    """
    Parse chemical name from row and return chemical_search_name and components list:
        e.g.:
        R-404A (HFC-125=44%, HFC-134a=4%, HFC-143a=52%) =>
            ("R-404A", [("HFC-125", "44"), ("HFC-134a", "4"), ("HFC-143a", "52")])
        R125/R218/R290 (86%/9%/5%) =>
            R125/R218/R290 (86%/9%/5%),   [('R125', '86'), ('R218', '9'), ('R290', '5')]
        R23/Other uncontrolled substances (98%/2%) =>
            R23/Other uncontrolled substances (98%/2%), [(R23, 98), (Other substances, 2)]
        HFC-23 (use) => HFC-23, []
    @param chemical_name string
    @return tuple => (chemical_search_name, components)
        - chemical_search_name = string
        - components = list of tuple (substance_name, percentage)
    """
    # remove Fullwidth Right Parenthesis
    chemical_name = chemical_name.replace("）", ")").strip()
    chemical_name = CHEMICAL_NAME_MAPPING.get(chemical_name, chemical_name)

    # HFC-23 (use) => HFC-23, []
    if "(use)" in chemical_name:
        chemical_name = chemical_name.replace("(use)", "").strip()
        return chemical_name, []

    # R23/Other uncontrolled substances (98%/2%)
    # R32/R125/R134a/HFO (24%/25%/26%/25%)
    if ("Other uncontrolled substances" in chemical_name) or (
        re.search(BLEND_COMPOSITION_RE, chemical_name)
    ):
        chemical_name.replace("Other uncontrolled substances", "Other substances")

        substances, percentages = chemical_name.split("(")
        substances = substances.strip().split("/")

        percentages = re.findall(r"(\d{1,3}\.?\,?\d{,3})\%", percentages)
        if len(substances) != len(percentages):
            return chemical_name, []
        components = list(zip(substances, percentages))
        return chemical_name, components

    components = re.findall(BLEND_COMPONENTS_RE, chemical_name)
    if components:
        # check if the number of components is equal to the number of %
        if chemical_name.count("%") != len(components):
            # R-514A (HFO-1336mzz=74,7%, trans-Dicloroetileno=25,3%) => components = [HFO-1336mzz, 74.7]
            components = []

        components = [(c.replace(" ", "-").strip(), p) for c, p in components]
        chemical_search_name = chemical_name.split("(")[0].strip()
        return chemical_search_name, components

    return chemical_name, components


def get_country_by_name(country_name, index_row, logger):
    """
    get country object from country name
    @param country_name = string
    @param index_row = int
    @param logger = logger object

    @return Country object
    """
    country_name = COUNTRY_NAME_MAPPING.get(country_name, country_name)
    country = get_object_by_name(Country, country_name, index_row, "country", logger)
    return country


def get_chemical(chemical_name, index_row, logger):
    """
    parse chemical name from row and return substance or blend:
        - if the chemical is a substance => return (substance, None)
        - if the chemical is a blend => return (None, blend)
        - if we can't find this chemical => return (None, None)
    @param chemical_name = string
    @param index_row = int
    @param logger = logger object

    @return tuple => (int, None) or (None, int) or (None, None)
    """

    chemical_search_name, components = parse_chemical_name(chemical_name)
    chemical, chemical_type = get_chemical_by_name_or_components(
        chemical_search_name, components
    )

    if not chemical:
        logger.warning(
            f"[row: {index_row + OFFSET}]: "
            f"This chemical does not exist: {chemical_name}, "
            f"Searched name: {chemical_search_name}, searched components: {components}"
        )
        return None, None

    if chemical_type == "substance":
        return chemical, None

    return None, chemical
