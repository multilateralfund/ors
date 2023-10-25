import json
import logging

from django.conf import settings
from django.db import transaction
from core.import_data.utils import (
    PCR_DIR_LIST,
    check_json_data,
    delete_old_data,
    get_object_by_code,
)

from core.models.project import MetaProject
from core.models.project_complition_report import PCRActivity, PCRSector


logger = logging.getLogger(__name__)

IMPORTANT_ARGS = [
    "Typeofactivity",
    "Plannedoutput",
    "Actualactivityoutput",
]


def import_activity_sectors(file_path):
    """
    Import activity sectors from json file

    @param file_path = str (file path for import file)

    @return dict (dict of pcr sectors)
    """
    with open(file_path, encoding="utf8") as f:
        json_data = json.load(f)

    sectors_dict = {}
    for sector_json in json_data:
        # skip empty sectors
        if not sector_json["Typeofactivity"]:
            continue

        sector_data = {
            "name": sector_json["Typeofactivity"],
            "sector_type": sector_json["Type"],
        }
        sector, _ = PCRSector.objects.get_or_create(**sector_data)
        sectors_dict[sector_json["Id"]] = sector

    return sectors_dict


def parse_file(file_path, sectors_dict):
    """
    Import pcr activities from json file

    @param file_path = str (file path for import file)
    @param sectors_dict = dict (dict of pcr sectors)
    """
    with open(file_path, encoding="utf8") as f:
        json_data = json.load(f)

    activities = []
    for activity_json in json_data:
        if not check_json_data(activity_json, IMPORTANT_ARGS):
            logger.warning(
                f"⚠️ activity {activity_json['Id']} not imported (too few data)"
            )
            continue

        # get meta project by code
        meta_proj = get_object_by_code(
            MetaProject,
            activity_json["ProjectId"],
            "pcr_project_id",
            activity_json["Id"],
        )
        if not meta_proj:
            continue

        # get activity sector
        sector = sectors_dict.get(activity_json["SectorId"])
        if not sector:
            logger.warning(
                f"⚠️ could not find sector {activity_json['SectorId']} "
                f"for activity {activity_json['Id']}"
            )
            continue

        # create activitiy
        activity_data = {
            "meta_project": meta_proj,
            "sector": sector,
            "type_of_activity": activity_json["Typeofactivity"],
            "planned_output": activity_json["Plannedoutput"],
            "actual_activity_output": activity_json["Actualactivityoutput"],
            "evaluation": activity_json["Evaluation"],
            "explanation": activity_json["Explanation"],
            "source_file": file_path,
        }

        activities.append(PCRActivity(**activity_data))

    PCRActivity.objects.bulk_create(activities, batch_size=1000)


@transaction.atomic
def import_pcr_activities():
    db_dir_path = settings.IMPORT_DATA_DIR / "pcr"
    for database_name in PCR_DIR_LIST:
        logger.info(f"⏳ importing pcr activities from {database_name}")
        logger.info(f"importing pcr activity sectors from {database_name}")
        file_path = db_dir_path / database_name / "PCRSector.json"
        sectors_dict = import_activity_sectors(file_path)

        file_path = db_dir_path / database_name / "PCRActivity.json"
        delete_old_data(PCRActivity, file_path)
        parse_file(file_path, sectors_dict)
        logger.info(f"✔ pcr activities from {database_name} imported")
