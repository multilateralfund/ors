import json
import logging
from datetime import datetime

from django.conf import settings
from django.db import transaction
from core.import_data.utils import PCR_DIR_LIST

from core.models.project import MetaProject
from core.models.project_completion_report import OLD_PCR


logger = logging.getLogger(__name__)


def get_submission_dates(file_path):
    """
    Get the earliest agency submission date for each old PCR

    @param file_path = str (file path for import file)

    @return dict
        - struct: {pcr_project_id: submission_date}
    """
    with open(file_path, encoding="utf8") as f:
        json_data = json.load(f)

    submission_dates = {}
    for submission_json in json_data:
        if not submission_json["SubmissionDate"]:
            continue
        pcr_project_id = str(submission_json["ProjectId"])
        submission_date = datetime.fromisoformat(
            submission_json["SubmissionDate"]
        ).date()
        if (
            pcr_project_id not in submission_dates
            or submission_date < submission_dates[pcr_project_id]
        ):
            submission_dates[pcr_project_id] = submission_date

    return submission_dates


def parse_file(file_path):
    """
    Set the old PCR submission date from json file

    @param file_path = str (file path for import file)
    """
    submission_dates = get_submission_dates(file_path)

    meta_projects = {}
    for meta_project in MetaProject.objects.filter(
        pcr_project_id__in=submission_dates.keys()
    ):
        if meta_project.pcr_project_id in meta_projects:
            logger.warning(
                f"{file_path} ⚠️ multiple meta projects with "
                f"pcr_project_id: {meta_project.pcr_project_id}"
            )
            continue
        meta_projects[meta_project.pcr_project_id] = meta_project

    for pcr_project_id, submission_date in submission_dates.items():
        meta_project = meta_projects.get(pcr_project_id)
        if not meta_project:
            logger.info(
                f"{file_path} This MetaProject does not exists in data base: "
                f"pcr_project_id={pcr_project_id}"
            )
            continue

        OLD_PCR.objects.update_or_create(
            meta_project=meta_project,
            defaults={"submission_date": submission_date},
        )


@transaction.atomic
def import_pcr_submissions():
    db_dir_path = settings.IMPORT_DATA_DIR / "pcr"
    for database_name in PCR_DIR_LIST:
        logger.info(f"⏳ importing pcr submission dates from {database_name}")
        file_path = db_dir_path / database_name / "PCRAgencySubmission.json"
        parse_file(file_path)
        logger.info(f"✔ pcr submission dates from {database_name} imported")
