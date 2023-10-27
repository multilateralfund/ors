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
    DelayCategory,
    PCRDelayExplanation,
)


logger = logging.getLogger(__name__)


def parse_file(file_path, category_dict, agency_dict):
    """
    Import pcr delay explanations from json file

    @param file_path = str (file path for import file)
    @param category_dict = dict
    @param agency_dict = dict
    """
    with open(file_path, encoding="utf8") as f:
        json_data = json.load(f)

    explanations = []
    for explanation_json in json_data:
        # get meta project by code
        meta_proj = get_object_by_code(
            MetaProject,
            explanation_json["ProjectId"],
            "pcr_project_id",
            explanation_json["Id"],
        )
        if not meta_proj:
            continue

        # get agency
        agency = agency_dict.get(explanation_json["AgencyId"])

        # get explanation category
        category = category_dict.get(explanation_json["TitleId"])

        # create explanation
        explanation_data = {
            "meta_project": meta_proj,
            "agency": agency,
            "category": category,
            "delay_cause": explanation_json["CauseOfDelays"],
            "measures_to_overcome": explanation_json["MeasuresToOvercome"],
            "source_file": file_path,
        }

        explanations.append(PCRDelayExplanation(**explanation_data))

    PCRDelayExplanation.objects.bulk_create(explanations, batch_size=1000)


@transaction.atomic
def import_pcr_delay_explanations():
    db_dir_path = settings.IMPORT_DATA_DIR / "pcr"
    for database_name in PCR_DIR_LIST:
        logger.info(f"⏳ importing pcr delay explanations from {database_name}")
        logger.info(f"importing pcr delay categories from {database_name}")
        file_path = db_dir_path / database_name / "PCRTitle53.json"
        category_dict = import_pcr_categories(file_path, DelayCategory)

        logger.info(f"parsing agencies file from {database_name}")
        file_path = db_dir_path / database_name / "Agencies.json"
        agency_dict = get_agency_dict(file_path)

        file_path = db_dir_path / database_name / "PCR53.json"
        delete_old_data(PCRDelayExplanation, file_path)
        parse_file(file_path, category_dict, agency_dict)
        logger.info(f"✔ pcr delay explanations from {database_name} imported")
