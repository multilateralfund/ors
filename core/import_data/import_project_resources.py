import json
import logging

from django.db import transaction
from core.import_data.utils import IMPORT_PROJECTS_DIR, SUBSECTOR_NAME_MAPPING

from core.models.agency import Agency
from core.models.project import (
    ProjectSector,
    ProjectStatus,
    ProjectSubSector,
    ProjectType,
)

logger = logging.getLogger(__name__)

NEW_SUBSECTORS = [
    {
        "SEC": "OTH",
        "SUBSECTOR": "Policy paper",
        "SORT_SUBSECTOR": 99,
    },
    {
        "SEC": "KIP",
        "SUBSECTOR": "Preparation of project proposal",
        "SORT_SUBSECTOR": 99,
    },
    {
        "SEC": "PHA",
        "SUBSECTOR": "HFC phase down plan",
        "SORT_SUBSECTOR": 99,
    },
]

NEW_TYPES = [
    {
        "TYPE": "DOC",
        "TYPE_PRO": "DOC",
        "SORT_TYPE": 20,
    },
    {
        "TYPE": "PHA",
        "TYPE_PRO": "Phase Out",
        "SORT_TYPE": 90,
    },
]

NEW_STATUSES = [
    {
        "STATUS": "New Submission",
        "STATUS_CODE": "NEWSUB",
    },
    {
        "STATUS": "Unknow",
        "STATUS_CODE": "UNK",
    },
]


def import_agency(file_path):
    """
    Import agency from file

    @param file_path = str (file path for import file)
    """

    with open(file_path, "r", encoding="utf8") as f:
        agencies_json = json.load(f)

    for agency_json in agencies_json:
        agency_data = {
            "name": agency_json["AGENCY"],
        }
        Agency.objects.update_or_create(name=agency_data["name"], defaults=agency_data)


def import_sector(file_path):
    """
    Import sectors and subsectors from file

    @param file_path = str (file path for import file)
    """

    with open(file_path, "r", encoding="utf8") as f:
        sectors_json = json.load(f)

    for sector_json in sectors_json:
        sector_name = sector_json["SECTOR"].strip()
        sector_data = {
            "name": sector_name,
            "code": sector_json["SEC"].strip(),
            "sort_order": sector_json["SORT_SECTOR"],
        }
        ProjectSector.objects.update_or_create(
            name=sector_data["name"], defaults=sector_data
        )


def import_subsector(file_path):
    """
    Import sectors and subsectors from file
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)

    @param file_path = str (file path for import file)
    """

    with open(file_path, "r", encoding="utf8") as f:
        subsectors_json = json.load(f)

    # add other subsectors that are not in the file
    subsectors_json.extend(NEW_SUBSECTORS)

    for subsector_json in subsectors_json:
        # get sector
        sector = ProjectSector.objects.filter(
            code=subsector_json["SEC"].strip()
        ).first()
        if not sector:
            logger.warning(
                f"⚠️ {subsector_json['SEC']} sector not fount => {subsector_json['SUBSECTOR']} not imported"
            )
            continue

        # set subsector data
        subsector_name = subsector_json["SUBSECTOR"].strip()
        subsector_name = SUBSECTOR_NAME_MAPPING.get(subsector_name, subsector_name)
        subsector_code = (
            subsector_json["CODE_SUBSECTOR"].strip()
            if subsector_json.get("CODE_SUBSECTOR")
            else None
        )
        subsector_data = {
            "name": subsector_name,
            "code": subsector_code,
            "sector": sector,
            "sort_order": subsector_json["SORT_SUBSECTOR"],
        }

        ProjectSubSector.objects.update_or_create(
            name=subsector_data["name"], sector_id=sector.id, defaults=subsector_data
        )


def import_project_status(file_path):
    """
    Import project status from file

    @param file_path = str (file path for import file)
    """

    with open(file_path, "r", encoding="utf8") as f:
        statuses_json = json.load(f)

    # add other statuses that are not in the file
    statuses_json.extend(NEW_STATUSES)

    for status_json in statuses_json:
        status_data = {
            "name": status_json["STATUS"],
            "code": status_json["STATUS_CODE"],
        }
        ProjectStatus.objects.update_or_create(
            name=status_data["name"], defaults=status_data
        )


def import_project_type(file_path):
    """
    Import project type from file

    @param file_path = str (file path for import file)
    """
    with open(file_path, "r", encoding="utf8") as f:
        types_json = json.load(f)

    # add other types that are not in the file
    types_json.extend(NEW_TYPES)

    for type_json in types_json:
        type_data = {
            "code": type_json["TYPE"],
            "name": type_json["TYPE_PRO"],
            "sort_order": type_json["SORT_TYPE"],
        }
        ProjectType.objects.update_or_create(name=type_data["name"], defaults=type_data)


@transaction.atomic
def import_project_resources():
    file_path = IMPORT_PROJECTS_DIR / "tbAgency.json"
    import_agency(file_path)
    logger.info("✔ agencies imported")

    file_path = IMPORT_PROJECTS_DIR / "tbSector.json"
    import_sector(file_path)
    logger.info("✔ sectors imported")

    file_path = IMPORT_PROJECTS_DIR / "tbSubsector.json"
    import_subsector(file_path)
    logger.info("✔ subsectors imported")

    file_path = IMPORT_PROJECTS_DIR / "tbStatusOfProjects.json"
    import_project_status(file_path)
    logger.info("✔ project statuses imported")

    file_path = IMPORT_PROJECTS_DIR / "tbTypeOfProject.json"
    import_project_type(file_path)
    logger.info("✔ project types imported")
