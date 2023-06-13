import json
from core.models.blend import Blend, BlendAltName, BlendComponents
from core.models.country import Country
from core.models.country_programme import CountryProgrammeReport
from core.models.substance import Substance, SubstanceAltName


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
}

# --- list of db names ---
DB_DIR_LIST = ["CP", "CP2012"]

# --- list of country names that can be skipped ---
SKIP_COUNTRY_LIST = [
    "global",
    "zaire",
]


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


def get_chemical_by_name(chemical_name, chemical_type):
    """
    get chemical by name or alt name (case insensitive)
    @param chemical_name: string chemical name
    @param chemical_type: string chemical type (substance | blend)

    @return: Substance object | Blend object | None
    """
    if not chemical_name:
        return None

    if chemical_type == "substance":
        cls, cls_alt_name = Substance, SubstanceAltName
    elif chemical_type == "blend":
        cls, cls_alt_name = Blend, BlendAltName

    chemical = cls.objects.get_by_name(chemical_name).first()
    if chemical:
        return chemical

    chemical = cls_alt_name.objects.get_by_name(chemical_name).first()
    if chemical:
        if chemical_type == "substance":
            return chemical.substance
        return chemical.blend

    return None


def get_blend_by_name_or_components(blend_name, components):
    """
    get blend by name or components
    @param blend_name: string blend name
    @param components: list of tuples (substance_name, percentage)

    @return: int blend id
    """
    blend = get_chemical_by_name(blend_name, "blend")
    if blend:
        return blend

    if components:
        subst_prcnt = []
        for substance_name, percentage in components:
            try:
                subst = get_chemical_by_name(substance_name, "substance")
                if not subst:
                    return None
                prcnt = float(percentage) / 100
                subst_prcnt.append((subst, prcnt))
            except ValueError:
                return None

        blend = BlendComponents.objects.get_blend_by_components(subst_prcnt)

    return blend


def get_chemical_by_name_or_components(chemical_name, components=None):
    """
    get chemical by name or alt name (case insensitive) or components (blends)
    @param chemical_name: string chemical name
    @param components: list of tuples (substance_name, percentage) (for blends)

    @return: tuple(object, string) (substance | blend, chemical_type)
    """
    if not chemical_name:
        return None, None

    substance = get_chemical_by_name(chemical_name, "substance")
    if substance:
        return substance, "substance"

    blend = get_blend_by_name_or_components(chemical_name, components)
    if blend:
        return blend, "blend"

    return None, None


def get_cp_report(year, country_name, country_id):
    """
    get or create country program report object by year and country
    @param year = int
    @param country_name = string
    @param country_id = int

    @return country_program = CountryProgrammeReport object
    """
    cp_name = f"{country_name} {year}"
    cp, _ = CountryProgrammeReport.objects.get_or_create(
        name=cp_name, year=year, country_id=country_id
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
    obj = cls.objects.get_by_name(obj_name).first()
    if not obj:
        logger.info(
            f"[row: {index_row}]: This {obj_type_name} does not exists in data base: {obj_name}"
        )

    return obj


# --- xlsx import utils ---
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
            f"⚠️ [row: {index_row}] "
            f"The following columns have negative values: {negative_values}"
        )
    return is_empty


# --- cp databases import utils ---
def get_cp_report_for_db_import(year_dict, country_dict, json_entry, logger, entry_id):
    """
    get or create country program report object by year and country
    @param year_dict = dict
    @param country_dict = dict
    @param json_entry = dict (json entry)
    @param logger = logger object
    @param entry_id = int

    @return country_program = CountryProgrammeReport object
    """

    # check if year and country exists in dictioanries
    if json_entry["CountryId"] not in country_dict:
        logger.warning(
            f"Country not found: {json_entry['CountryId']} (EntryID: {entry_id})"
        )
        return None
    if json_entry["ProjectDateId"] not in year_dict:
        logger.warning(
            f"Year not found: {json_entry['ProjectDateId']} (EntryID: {entry_id})"
        )
        return None

    year = year_dict[json_entry["ProjectDateId"]]
    country = country_dict[json_entry["CountryId"]]

    # skip test country
    if country["name"] == "test":
        return None

    # get cp report id
    cp_report = get_cp_report(year, country["name"], country["id"])
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

        country = Country.objects.get_by_name(country_name).first()
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
