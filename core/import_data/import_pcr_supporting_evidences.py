import logging
import re

from django.conf import settings
from django.core.files import File
from django.db import transaction

from core.import_data.utils import get_old_pcr
from core.models.project import MetaProject
from core.models.project_completion_report import OLD_PCRSupportingEvidence


logger = logging.getLogger(__name__)

PCR_REPORTS_DIR = "pcr reports"
# e.g. PCR_881.pdf, where 881 is the old PCR project id (MetaProject.pcr_project_id)
PCR_REPORT_FILE_RE = re.compile(r"^PCR_(\d+)\.pdf$", re.IGNORECASE)


def get_report_files(dir_path):
    """
    Get the old PCR report files from a directory

    @param dir_path = Path (directory with the pcr report files)

    @return dict
        - struct: {pcr_project_id: file_path}
    """
    report_files = {}
    for file_path in sorted(dir_path.iterdir()):
        match = PCR_REPORT_FILE_RE.match(file_path.name)
        if not match:
            continue
        report_files[match.group(1)] = file_path
    return report_files


def delete_old_evidences(source_file):
    """
    Delete the supporting evidences (and their stored files) previously imported
    from a source file

    @param source_file = str (source file name)
    """
    for evidence in OLD_PCRSupportingEvidence.objects.filter(source_file=source_file):
        evidence.file.delete(save=False)
        evidence.delete()


def parse_dir(dir_path):
    """
    Import the old PCR report files as old PCR supporting evidences

    @param dir_path = Path (directory with the pcr report files)
    """
    report_files = get_report_files(dir_path)

    meta_projects = {}
    old_pcr_dict = {}
    for meta_project in MetaProject.objects.filter(
        pcr_project_id__in=report_files.keys()
    ):
        if meta_project.pcr_project_id in meta_projects:
            logger.warning(
                f"{dir_path} ⚠️ multiple meta projects with "
                f"pcr_project_id: {meta_project.pcr_project_id}"
            )
            continue
        meta_projects[meta_project.pcr_project_id] = meta_project

    for pcr_project_id, file_path in report_files.items():
        meta_project = meta_projects.get(pcr_project_id)
        if not meta_project:
            logger.warning(
                f"{file_path} This MetaProject does not exists in data base: "
                f"pcr_project_id={pcr_project_id}"
            )
            continue

        delete_old_evidences(file_path.name)

        evidence = OLD_PCRSupportingEvidence(
            old_pcr=get_old_pcr(meta_project, old_pcr_dict),
            filename=file_path.name,
            source_file=file_path.name,
        )
        with open(file_path, "rb") as f:
            evidence.file.save(file_path.name, File(f), save=False)
        evidence.save()


@transaction.atomic
def import_pcr_supporting_evidences():
    dir_path = settings.IMPORT_DATA_DIR / "pcr" / PCR_REPORTS_DIR
    logger.info(f"⏳ importing pcr supporting evidences from {dir_path}")
    parse_dir(dir_path)
    logger.info("✔ pcr supporting evidences imported")
