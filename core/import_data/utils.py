import decimal
import json
import logging
import re

from dateutil.parser import parse, ParserError
from django.conf import settings
from django.db import models
from core.import_data.mapping_names_dict import (
    CHEMICAL_NAME_MAPPING,
    COUNTRY_NAME_MAPPING,
    PROJECT_TYPE_CODE_MAPPING,
    SECTOR_CODE_MAPPING,
    SUBSECTOR_SECTOR_MAPPING,
    USAGE_NAME_MAPPING,
)

from core.models.adm import AdmColumn, AdmRow
from core.models.agency import Agency
from core.models.blend import Blend
from core.models.country import Country
from core.models.country_programme import CPRecord, CPReport, CPUsage
from core.models.meeting import Meeting
from core.models.project import (
    Project,
    ProjectSector,
    ProjectStatus,
    ProjectSubSector,
    ProjectType,
)
from core.models.substance import Substance
from core.models.time_frame import TimeFrame
from core.models.usage import Usage
from core.utils import IMPORT_DB_MAX_YEAR

# pylint: disable=C0302,R0913

logger = logging.getLogger(__name__)

IMPORT_RESOURCES_DIR = settings.ROOT_DIR / "import_data" / "resources"
IMPORT_PROJECTS_DIR = settings.IMPORT_DATA_DIR / "project_database"

PCR_DIR_LIST = ["pcr2023", "hpmppcr2023"]

# When we parse excel files, "index_row" is two steps behind. Because of this, the
# excel files are hard to check.
# Used only for logs.
OFFSET = 2

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

OUTDATED_SECTORS = [
    "MUS",
    "Multi-sector",
    "OTH",
    "Other",
    "SEV",
    "Several",
]

# --- import utils ---


def parse_string(string_value):
    """
    remove white spaces and convert to lower case
    """
    if not string_value:
        return None

    return string_value.strip().lower()


def parse_date(date_string):
    """
    Parse date string

    @param date_string: string date
    @return: date object
    """
    if not date_string:
        return None

    try:
        return parse(date_string)
    except ParserError:
        logger.warning(f"⚠️ Invalid date: {date_string}")
        return None


# pylint: disable-next=W0613
def parse_noop(value):
    """
    NOOP return value, coalesce empty string to None

    @param value: any value
    @return: value or None
    """
    if value == "":
        return None
    return value


def delete_old_data(cls, source_file=None):
    """
    Delete old data from db for a specific source file

    @param cls: Class instance
    @param source_file: string source file name
    """
    if source_file:
        cls.objects.filter(source_file__iexact=str(source_file).lower()).all().delete()
        logger.info(f"✔ old {cls.__name__} from {source_file} deleted")
        return
    cls.objects.all().delete()
    logger.info(f"✔ old {cls.__name__} deleted")


def get_meeting_by_number(meeting_number, row_index):
    """
    get meeting by number or log error if not found in db
    @param meeting_number: integer -> meeting number
    @return: meeting object or None
    """
    if not meeting_number:
        return None
    # check if the meeting string is a number
    if not str(meeting_number).isnumeric():
        logger.info(
            f"[row: {row_index}]: This meeting number is not valid: {meeting_number}"
        )
        return None
    try:
        return Meeting.objects.get(number=meeting_number)
    except Meeting.DoesNotExist:
        logger.info(
            f"[row: {row_index}]: This meeting does not exists in data base {meeting_number}"
        )
        return None


def get_chemical_by_name_or_components(
    chemical_name,
    components=None,
):
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


def get_sector_by_code(sector_code, row_index):
    """
    get sector by code or log error if not found in db
    @param sector_code: string -> sector code
    @param row_index: integer -> index row
    @param use_offset: boolean (if the index_row should be increased with OFFSET)
    """
    new_sector_code = SECTOR_CODE_MAPPING.get(sector_code, sector_code)
    return get_object_by_code(
        ProjectSector,
        new_sector_code,
        "code",
        row_index,
    )


def get_sector_subsector_details(sector_code, subsector_name, row_index):
    """
    get sector and subsector details by sector code and subsector name or log error if not found in db
    @param sector_code: string -> sector code
    @param subsector_name: string -> subsector name
    @param row_index: integer -> index row
    @return: tuple(sector, subsector) or (None, None)
    """

    if sector_code in OUTDATED_SECTORS:
        sector_code = None
    sector = None
    # get only the sector
    if not subsector_name and sector_code:
        sector = get_sector_by_code(sector_code, row_index)
        return sector, None

    sector_code = SECTOR_CODE_MAPPING.get(sector_code, sector_code)
    # map sector and subsector names
    subs_mapping = SUBSECTOR_SECTOR_MAPPING.get(
        subsector_name,
        {
            "subsector_name": subsector_name,
            "sector_code": sector_code,
        },
    )
    new_sector_code = subs_mapping["sector_code"] or sector_code
    new_subsector_name = subs_mapping["subsector_name"]

    # get sector by mapped string
    if new_sector_code:
        sector = get_object_by_name(
            ProjectSector, new_sector_code, row_index, "sector", with_log=False
        )

    # check if the subsector is not outdated and if the sector exists
    if not new_subsector_name and sector:
        return sector, None

    if not new_subsector_name and not sector:
        if sector_code:
            # if the sector is not outdated, log error
            logger.info(
                f"[row: {row_index}]: This prpoject does not have a sector or a subsector:"
                f"serched info: [sector: {sector_code}, subsector: {subsector_name}]"
            )
        return None, None

    # get subsector
    if not sector:
        subsector = ProjectSubSector.objects.get_all_by_name_or_code(new_subsector_name)

        if subsector.count() > 1:
            logger.info(
                f"[row: {row_index}]: There are multiple subsectors: {subsector_name} -> "
                f"search name: {new_subsector_name} (sector: {new_sector_code})"
            )
            return sector, None

        subsector = subsector.first()
    else:
        subsector = ProjectSubSector.objects.find_by_name_and_sector(
            new_subsector_name, sector
        )

    if not subsector:
        if sector_code:
            # if the sector is not outdated, log error
            logger.info(
                f"[row: {row_index}]: This subsector does not exists in data base: "
                f"{subsector_name} -> search name: {new_subsector_name} (sector: {new_sector_code})"
            )
        return sector, None

    if not sector:
        return subsector.sector, subsector

    return sector, subsector


def get_project_type_by_code(project_type_code, row_index):
    """
    get project type by code or log error if not found in db
    @param project_type_code: string -> project type code
    @param row_index: integer -> index row
    @param use_offset: boolean (if the index_row should be increased with OFFSET)
    """
    new_project_type_code = PROJECT_TYPE_CODE_MAPPING.get(
        project_type_code, project_type_code
    )
    return get_object_by_code(
        ProjectType,
        new_project_type_code,
        "code",
        row_index,
    )


def get_cp_report(
    year,
    country_name,
    country_id=None,
    index_row=None,
    other_args=None,
    use_offset=True,
):
    """
    get or create country program report object by year and country
    @param year = int
    @param country_name = string
    @param country_id = int
    @param index_row = int
    @param other_args = dict (other arguments for CPReport object)
    @param use_offset = boolean (if the index_row should be increased with OFFSET)

    @return country_program = CPReport object
    """
    if not country_id:
        country = get_country_by_name(country_name, index_row, use_offset=use_offset)
        country_id = country.id

    cp_name = f"{country_name} {year}"
    data = {
        "name": cp_name,
        "year": year,
        "country_id": country_id,
        "status": CPReport.CPReportStatus.FINAL,
    }
    if other_args:
        data.update(other_args)

    cp, _ = CPReport.objects.update_or_create(
        name=cp_name, year=year, country_id=country_id, defaults=data
    )

    return cp


def get_object_by_name(
    cls, obj_name, index_row, obj_type_name, use_offset=True, with_log=True
):
    """
    get object by name or log error if not found in db
    @param cls: Class instance
    @param obj_name: string -> object name (filter value)
    @param index_row: integer -> index row
    @param obj_type_name: string -> object type name (for logging)
    @param use_offset: boolean (if the index_row should be increased with OFFSET)
    @param with_log: boolean (if the error should be logged)

    @return: object or None
    """
    if not obj_name:
        return None
    obj = cls.objects.find_by_name(obj_name)

    if not obj and with_log:
        if use_offset:
            index_row += OFFSET
        logger.info(
            f"[row: {index_row}]: This {obj_type_name} does not exists in data base: {obj_name}"
        )

    return obj


def get_object_by_code(cls, code, column, index_row, with_log=True):
    """
    get object by code or log error if not found in db
    @param cls: Class instance
    @param code: string -> unique code (filter value)
    @param column: string -> column name (filter column)
    @param index_row: integer -> index row
    @return: object or None
    """
    if not code:
        return None
    try:
        return cls.objects.get(**{column: code})
    except cls.DoesNotExist:
        if with_log:
            logger.info(
                f"[row: {index_row}]: This {cls.__name__} does not exists in data base: {column}={code}"
            )
        return None


def create_cp_record(record_data, usages_data, index_row, update_or_log="log"):
    """
    create cp record and usages objects from data
    -> if the record / usages exists, update it and log inconsistent data
    -> if the record  doesn't exists, create it

    @param record_data = dict (record data)
    @param usages_data = list (list of usages data)
    @param index_row = int
    @param update_or_log = str (update or log)
        (if the record should be updated or logged the inconsistent data)

    @return cp_usages = list (list of CPUsage objects)
    """

    inconsistent_data = []
    cp_usages = []
    # get cp record if exists
    record = CPRecord.objects.filter(
        country_programme_report_id=record_data["country_programme_report_id"],
        substance_id=record_data["substance_id"],
        blend_id=record_data["blend_id"],
        section=record_data["section"],
    ).first()

    if record:
        # check for inconsistent data and update record if needed
        for key, value in record_data.items():
            if update_or_log == "update" and key not in ["source_file"]:
                # no need to check for inconsistent data, just update the record
                setattr(record, key, value)
                continue

            # check for inconsistent data and log it
            if not getattr(record, key, None):
                # set attribute if it's not set
                setattr(record, key, value)
            elif getattr(record, key) != value and key not in [
                "source_file",
                "display_name",
            ]:
                inconsistent_data.append(f"{key}={getattr(record, key)}")
    else:
        # create record if it doesn't exist
        record = CPRecord.objects.create(**record_data)

    # insert records
    for usage_data in usages_data:
        usage_data["country_programme_record_id"] = record.id

        # get cp usage if exists
        cp_usage = CPUsage.objects.filter(
            country_programme_record_id=usage_data["country_programme_record_id"],
            usage=usage_data["usage"],
        ).first()
        if not cp_usage:
            cp_usages.append(CPUsage(**usage_data))
            continue

        if update_or_log == "update":
            # no need to check for inconsistent data, just update the cp usage
            cp_usage.quantity = usage_data["quantity"]
            cp_usage.save()
            continue

        # check for inconsistent data and update cp usage if needed
        if cp_usage.quantity != usage_data["quantity"]:
            inconsistent_data.append(
                f"quantity: {usage_data['usage'].name}={cp_usage.quantity}"
            )

    # log inconsistent data
    if inconsistent_data:
        logger.warning(
            f"⚠️ [row: {index_row + OFFSET}] The following data is inconsistent: {inconsistent_data}"
        )

    return cp_usages


# --- cp databases import utils ---
def get_adm_column(column_name, section):
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
    if "index" not in row_data:
        row_data["index"] = None

    existing_row = (
        AdmRow.objects.filter(
            text=row_data["text"],
            section=row_data["section"],
            index=row_data["index"],
            country_programme_report_id=row_data.get(
                "country_programme_report_id", None
            ),
        )
        .select_related("time_frame")
        .first()
    )
    min_year = row_data.pop("min_year")
    max_year = row_data.pop("max_year")

    if existing_row:
        # set correct time frame for this row
        min_year = min(existing_row.time_frame.min_year, min_year)
        max_year = max(existing_row.time_frame.max_year, max_year)
        existing_row.time_frame = TimeFrame.objects.find_by_frame(min_year, max_year)
        existing_row.save()
        return existing_row

    row_data["time_frame"] = TimeFrame.objects.find_by_frame(min_year, max_year)
    return AdmRow.objects.create(**row_data)


def get_cp_report_for_db_import(
    year_dict, country_dict, json_entry, entry_id, other_args=None
):
    """
    get or create country program report object by year and country
    @param year_dict = dict
    @param country_dict = dict
    @param json_entry = dict (json entry)
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
        year, country["name"], country["id"], other_args=other_args, use_offset=False
    )
    return cp_report


def get_country_and_year_dict(dir_path):
    """
    Parse country and year json files and create dictionaries
    @param country_file = str (file path for country import file)
    @param year_file = str (file path for year import file)
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
    country_dict = get_country_dict_from_db_file(country_file)
    logger.info("✔ country file parsed")

    year_file = dir_path / "ProjectYear.json"
    year_dict = get_year_dict_from_db_file(year_file)
    logger.info("✔ year file parsed")

    return country_dict, year_dict


def get_country_dict_from_db_file(file_name):
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


# --- import pcr utils ---
def check_pcr_json_data(json_entry, important_args):
    """
    Check if the json entry has at least one of the important args

    @param json_entry = dict
    @param important_args = list
    @return bool
    """
    for arg in important_args:
        if json_entry[arg]:
            return True
    return False


def import_pcr_categories(file_path, category_class):
    with open(file_path, encoding="utf8") as f:
        json_data = json.load(f)

    category_dict = {}
    for category_json in json_data:
        # skip empty category
        if not category_json["Title"]:
            continue

        category_data = {
            "name": category_json["Title"],
            "sort_order": category_json["SortId"],
        }
        category, _ = category_class.objects.update_or_create(
            name=category_data["name"], defaults=category_data
        )
        category_dict[category_json["Id"]] = category

    return category_dict


def get_agency_dict(json_file_path):
    """
    Parse agency json file and create a dictionary
    @param json_file_path = str (file path for import file)

    @return agency_dict = dict
        - struct: {agency_cp_id: agency_name}
    """
    agency_dict = {}
    with open(json_file_path, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for agency_json in json_data:
        agency = get_object_by_name(
            Agency, agency_json["Name"], agency_json["ID"], "agency", use_offset=False
        )
        agency_dict[agency_json["ID"]] = agency

    return agency_dict


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


def check_headers(df, required_columns):
    """
    check if the df has all the required columns
    @param df = pandas dataFrame
    @param required_columns = list
    @return boolean
    """
    for c in required_columns:
        if c not in df.columns:
            logger.error("Invalid column list.")
            logger.warning(f"The following columns are required: {required_columns}")
            return False
    return True


def get_usages_from_sheet(df, non_usage_columns):
    """
    parse the df columns and extract the usages
    @param df = pandas dataFrame

    @return usage_dict = dictionary ({column_name: Usage obj})
    """
    usage_dict = {}
    for column_name in df.columns:
        if column_name in non_usage_columns:
            continue

        usage_name = column_name.replace("- ", "")
        usage_name = USAGE_NAME_MAPPING.get(usage_name, usage_name)

        usage = Usage.objects.find_by_name(usage_name)
        if not usage:
            logger.warning(f"This usage is not exists: {column_name} ({usage_name})")
            continue
        usage_dict[column_name] = usage

    return usage_dict


def check_empty_row(row, index_row, quantity_columns):
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
        HCFC-41** => HCFC-41, []
    @param chemical_name string
    @return tuple => (chemical_search_name, components)
        - chemical_search_name = string
        - components = list of tuple (substance_name, percentage)
    """
    # remove Fullwidth Right Parenthesis
    chemical_name = chemical_name.replace("）", ")").strip()
    chemical_name = CHEMICAL_NAME_MAPPING.get(chemical_name, chemical_name)

    # HCFC-41** => HCFC-41, []
    if "**" in chemical_name:
        chemical_name = chemical_name.replace("**", "").strip()
        return chemical_name, []

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


def get_country_by_name(country_name, index_row, use_offset=True):
    """
    get country object from country name
    @param country_name = string
    @param index_row = int
    @param use_offset = boolean (if the index_row should be increased with OFFSET)

    @return Country object
    """

    if country_name and country_name.endswith("(the)"):
        country_name = country_name[:-5]

    country_name = COUNTRY_NAME_MAPPING.get(country_name, country_name)
    country = get_object_by_name(
        Country, country_name, index_row, "country", use_offset=use_offset
    )
    return country


def get_chemical(chemical_name, index_row):
    """
    parse chemical name from row and return substance or blend:
        - if the chemical is a substance => return (substance, None)
        - if the chemical is a blend => return (None, blend)
        - if we can't find this chemical => return (None, None)
    @param chemical_name = string
    @param index_row = int
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


# --- projects import ---
def get_serial_number_from_code(project_code):
    """
    get serial number from project code and check if the project has additional funding
        - {Country or Region}/{Sector}/{MeetingNo where the project was approved}/{ProjectType}/{ProjectNumber}
        - if the serial number contains "+" then the project has additional funding
    @param project_code = string

    @return tuple => (serial_number, additional_funding)
    """
    serial_number = project_code.split("/")[4]
    additional_funding = "+" in serial_number

    # remove + from serial number
    serial_number = serial_number.replace("+", "")
    if not serial_number.isdigit():
        logger.warning(
            f"[Index row: {project_code}] Invalid serial number {serial_number}"
        )
        return None, False

    return serial_number, additional_funding


def get_project_base_data(item, item_index, is_submissions=True):
    """
    Get project base data
    ! if there is an empty value for country, agency, subsector, type or status return None
    @param item = dict (row data)
    @param item_index = int (index row)
    @param is_submissions = boolean (if the data is for a project submissions xlsx file)

    @return dict = {
        "country": Country object,
        "agency": Agency object,
        "sector": ProjectSector object,
        "sector_legacy": string,
        "subsector": ProjectSubSector object,
        "subsector_legacy": string,
        "project_type": ProjectType object,
        "project_type_legacy": string,
        "status": ProjectStatus object,
        "title": string,
        "description": string,
        "impact": string,
        "date_completion": string,
        "intersessional_approval": string,
        "retroactive_finance": string,
        "umbrella_project": string,
        "loan": string,
        "excom_provision": string,
        "products_manufactured": string,
        "operating_cost": string,
        "effectiveness_cost": string,
        "local_ownership": string,
        "export_to": string,
    }
    """

    country = get_country_by_name(
        item["COUNTRY"], item_index, use_offset=is_submissions
    )
    agency = get_object_by_name(
        Agency, item["AGENCY"], item_index, "agency", use_offset=is_submissions
    )
    sector, subsec = get_sector_subsector_details(
        item["SEC"], item["SUBSECTOR"], item_index
    )
    proj_type = get_project_type_by_code(item["TYPE"], item_index)

    status_str = item["STATUS_CODE"]
    if is_submissions and not status_str:
        status_str = "NEWSUB"

    project_status = get_object_by_name(
        ProjectStatus, status_str, item_index, "status", use_offset=is_submissions
    )

    # if country or agency or subsector does not exists then skip this row
    if not all([country, agency, proj_type, project_status]):
        return None

    date_completion = item["DATE_COMPLETION"]
    if not is_submissions:
        date_completion = parse_date(date_completion)

    project_data = {
        "country": country,
        "agency": agency,
        "sector": sector,
        "sector_legacy": item["SEC"],
        "subsector": subsec,
        "subsector_legacy": item["SUBSECTOR"],
        "project_type": proj_type,
        "project_type_legacy": item["TYPE"],
        "status": project_status,
        "title": item["PROJECT_TITLE"],
        "description": item.get("PROJECT_DESCRIPTION"),
        "impact": item["IMPACT"],
        "date_completion": date_completion,
        "intersessional_approval": item["INTERSESSIONAL_APPROVAL"],
        "retroactive_finance": item["RETROACTIVE_FINANCE"],
        "umbrella_project": item["UMBRELLA_PROJECT"],
        "loan": item["LOAN"],
    }

    optional_fields = [
        "EXCOM_PROVISION",
        "PRODUCTS_MANUFACTURED",
        "OPERATING_COST",
        "COST_EFFECTIVENESS",
        "LOCAL_OWNERSHIP",
        "EXPORT_TO",
        "CAPITAL_COST",
        "OPERATING_COST",
    ]
    for field in optional_fields:
        if field not in item:
            continue

        if field == "COST_EFFECTIVENESS":
            project_data["effectiveness_cost"] = item["COST_EFFECTIVENESS"]
        else:
            project_data[field.lower()] = item[field]

    return project_data


def update_or_create_project(project_data, update_status=True):
    # try to find the project by its code
    project = None
    if project_data.get("code"):
        project = Project.objects.filter(code__iexact=project_data["code"]).first()

    # some projects do not have the code set so we try to find them by other fields
    if not project:
        fields_filter = models.Q(
            title=project_data["title"],
            country=project_data["country"],
            agency=project_data["agency"],
            project_type=project_data["project_type"],
            serial_number_legacy=project_data["serial_number_legacy"],
            approval_meeting=project_data["approval_meeting"],
        )
        if project_data.get("subsector"):
            fields_filter &= models.Q(subsector=project_data["subsector"])
        elif project_data.get("sector"):
            fields_filter &= models.Q(sector=project_data["sector"])

        project = Project.objects.filter(fields_filter).first()

    # set project sector based on subsector
    if "sector" not in project_data and project_data.get("subsector"):
        project_data["sector"] = project_data["subsector"].sector

    if not project:
        # if the project does not exists then create it
        project = Project.objects.create(**project_data)
        return project

    if not update_status:
        project_data.pop("status", None)

    for key, value in project_data.items():
        setattr(project, key, value)
    project.save()

    return project
