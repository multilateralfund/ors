import json
import logging

from django.conf import settings
from django.db import transaction
from core.import_data.utils import (
    PCR_DIR_LIST,
    delete_old_data,
    get_agency_dict,
    get_object_by_code,
    import_pcr_categories,
)

from core.models.project import MetaProject
from core.models.project_complition_report import (
    LearnedLessonCategory,
    PCRLearnedLessons,
)


logger = logging.getLogger(__name__)


def parse_file(file_path, category_dict, agency_dict):
    """
    Import pcr learned lessons from json file

    @param file_path = str (file path for import file)
    @param category_dict = dict
    @param agency_dict = dict
    """
    with open(file_path, encoding="utf8") as f:
        json_data = json.load(f)

    lessons = []
    for lesson_json in json_data:
        # get meta project by code
        meta_proj = get_object_by_code(
            MetaProject,
            lesson_json["ProjectId"],
            "pcr_project_id",
            lesson_json["Id"],
        )
        if not meta_proj:
            continue

        # get agency
        agency = agency_dict.get(lesson_json["AgencyId"])

        # get lesson category
        category = category_dict.get(lesson_json["TitleId"])

        # create learned lesson
        lesson_data = {
            "meta_project": meta_proj,
            "agency": agency,
            "category": category,
            "description": lesson_json["Description"],
            "source_file": file_path,
        }

        lessons.append(PCRLearnedLessons(**lesson_data))

    PCRLearnedLessons.objects.bulk_create(lessons, batch_size=1000)


@transaction.atomic
def import_pcr_learned_lessons():
    db_dir_path = settings.IMPORT_DATA_DIR / "pcr"
    for database_name in PCR_DIR_LIST:
        logger.info(f"⏳ importing pcr learned lessons from {database_name}")
        logger.info(f"importing pcr learned lessons categories from {database_name}")
        file_path = db_dir_path / database_name / "PCRTitle6.json"
        category_dict = import_pcr_categories(file_path, LearnedLessonCategory)

        logger.info(f"parsing agencies file from {database_name}")
        file_path = db_dir_path / database_name / "Agencies.json"
        agency_dict = get_agency_dict(file_path)

        file_path = db_dir_path / database_name / "PCR6.json"
        delete_old_data(PCRLearnedLessons, file_path)
        parse_file(file_path, category_dict, agency_dict)
        logger.info(f"✔ pcr learned lessons from {database_name} imported")
