import json
import logging
import pandas as pd

from django.db import transaction
from core.import_data.utils import (
    IMPORT_PROJECTS_DIR,
    IMPORT_RESOURCES_DIR,
    SECTOR_CODE_MAPPING,
    SECTOR_NAME_MAPPING,
    SUBSECTOR_NAME_MAPPING,
)

from core.models.agency import Agency
from core.models.meeting import Meeting
from core.models.project import (
    ProjectCluster,
    ProjectSector,
    ProjectStatus,
    ProjectSubSector,
    ProjectType,
)
from core.models.rbm_measures import RBMMeasure

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

NEW_SECTORS = [
    {
        "SECTOR": "Servicing",
        "SEC": "SRV",
        "SORT_SECTOR": 17,
    },
    {
        "SECTOR": "Project monitoring and coordination",
        "SEC": "PMU",
        "SORT_SECTOR": 18,
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

    # add other sectors that are not in the file
    sectors_json.extend(NEW_SECTORS)

    for sector_json in sectors_json:
        sector_name = SECTOR_NAME_MAPPING.get(
            sector_json["SECTOR"].strip(), sector_json["SECTOR"].strip()
        )
        sector_code = SECTOR_CODE_MAPPING.get(
            sector_json["SEC"].strip(), sector_json["SEC"].strip()
        )
        sector_data = {
            "name": sector_name,
            "code": sector_code,
            "sort_order": sector_json["SORT_SECTOR"],
        }
        ProjectSector.objects.update_or_create(
            code=sector_data["code"], defaults=sector_data
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
        sector_code = SECTOR_CODE_MAPPING.get(
            subsector_json["SEC"].strip(), subsector_json["SEC"].strip()
        )
        sector = ProjectSector.objects.filter(code=sector_code).first()
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


def import_project_clusters(file_path):
    """
    Import project clusters from file
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)

    @param file_path = str (file path for import file)
    """

    df = pd.read_excel(file_path).fillna("")

    for index, row in df.iterrows():
        cluster_data = {
            "name": row["Name"],
            "code": row["Acronym"],
            "substance_type": row["Asscoaited Substance"].upper(),
            "sort_order": index,
        }
        ProjectCluster.objects.update_or_create(
            name=cluster_data["name"], defaults=cluster_data
        )


def import_rbm_measures(file_path):
    df = pd.read_excel(file_path).fillna("")

    for index, row in df.iterrows():
        measure_data = {
            "name": row["Name"],
            "sort_order": index,
        }
        RBMMeasure.objects.update_or_create(
            name=measure_data["name"], defaults=measure_data
        )


def import_meetings():
    for i in range(1, 92):
        meeting_data = {
            "number": i,
            "status": Meeting.MeetingStatus.COMPLETED,
        }
        Meeting.objects.update_or_create(
            number=meeting_data["number"], defaults=meeting_data
        )


@transaction.atomic
def import_project_resources():
    file_path = IMPORT_PROJECTS_DIR / "tbAgency.json"
    import_agency(file_path)
    logger.info("✔ agencies imported")

    file_path = IMPORT_PROJECTS_DIR / "tbSector.json"
    import_sector(file_path)
    logger.info("✔ sectors imported")

    file_path = IMPORT_PROJECTS_DIR / "tbSubsector.json"
    file_path2 = IMPORT_RESOURCES_DIR / "other_subsectors.json"
    for file_path in [file_path, file_path2]:
        import_subsector(file_path)
    logger.info("✔ subsectors imported")

    file_path = IMPORT_PROJECTS_DIR / "tbStatusOfProjects.json"
    import_project_status(file_path)
    logger.info("✔ project statuses imported")

    file_path = IMPORT_PROJECTS_DIR / "tbTypeOfProject.json"
    import_project_type(file_path)
    logger.info("✔ project types imported")

    file_path = IMPORT_RESOURCES_DIR / "project_clusters.xlsx"
    import_project_clusters(file_path)
    logger.info("✔ project clusters imported")

    file_path = IMPORT_RESOURCES_DIR / "rbm_measures.xlsx"
    import_rbm_measures(file_path)
    logger.info("✔ rbm measures imported")

    import_meetings()
    logger.info("✔ meetings imported")
