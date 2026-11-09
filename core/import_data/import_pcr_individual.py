import logging
import zipfile
from pathlib import PurePath

import openpyxl
from django.conf import settings
from django.core.files import File
from django.core.files.base import ContentFile
from django.db import transaction

from core.models.project import Project
from core.models.project_completion_report import (
    OLD_IndividualPCR,
    OLD_IndividualPCRLearnedLesson,
    OLD_IndividualPCRSupportingEvidence,
)


logger = logging.getLogger(__name__)

PCR_INDIVIDUAL_DIR = "pcr_individual_2026"
PCR_INDIVIDUAL_FILE = "IndividualPCRs- Final for migration - updated 03.11.2026.xlsx"
REPORTS_DIR = "PDF PCRs"
ADDITIONAL_DOCUMENTS_DIR = "Zip Folders"

COLUMNS = {
    "code": "Project code",
    "report": "PDF file name",
    "additional_document": "Additional documents",
    "lessons": "Agency_lessons learned",
}


def get_dir_path():
    return settings.IMPORT_DATA_DIR / "pcr" / PCR_INDIVIDUAL_DIR


def clean_value(value):
    """
    Strip the cell value (including non-breaking spaces)

    @param value = cell value

    @return str or None (for empty values)
    """
    if value is None:
        return None
    value = str(value).replace("\xa0", " ").strip()
    if value in ("", "None"):
        return None
    return value


def get_file_key(file_name):
    """
    Key used to match the file names from the xlsx with the files on disk. The
    extensions and spaces are ignored, as they are not always consistent
    (e.g. IND254ANX.pad for IND254ANX.zip, ECU11.pdf for "ECU 11.pdf")
    """
    return "".join(file_name.split(".")[0].split()).lower()


def read_rows(file_path):
    """
    Read the individual PCR rows from the xlsx file

    @param file_path = Path (xlsx file path)

    @return list of dicts
        - struct: {row_number, code, report, additional_document, lessons}
    """
    wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
    ws = wb.worksheets[0]
    rows = ws.iter_rows(values_only=True)

    header = [clean_value(cell) for cell in next(rows)]
    indexes = {key: header.index(column) for key, column in COLUMNS.items()}

    result = []
    for row_number, row in enumerate(rows, start=2):
        row_data = {
            key: clean_value(row[index]) if index < len(row) else None
            for key, index in indexes.items()
        }
        if not any(row_data.values()):
            continue
        row_data["row_number"] = row_number
        result.append(row_data)
    wb.close()
    return result


def get_projects_by_legacy_code(codes):
    """
    Get the (latest version) projects by their legacy code

    @param codes = set (legacy codes)

    @return dict
        - struct: {legacy_code: Project}
    """
    projects = {}
    duplicates = set()
    for project in Project.objects.filter(legacy_code__in=codes):
        if project.legacy_code in projects:
            duplicates.add(project.legacy_code)
        projects[project.legacy_code] = project

    for code in duplicates:
        logger.warning(f"⚠️ multiple projects with legacy code {code}, skipped")
        projects.pop(code)
    return projects


def get_rows_with_pcr(file_path):
    """
    Get the xlsx rows together with the old individual PCR of their project
    (created if missing). The rows without a matching project are skipped.

    @param file_path = Path (xlsx file path)

    @return list of tuples
        - struct: (row_data, OLD_IndividualPCR)
    """
    rows = read_rows(file_path)
    projects = get_projects_by_legacy_code({row["code"] for row in rows if row["code"]})

    result = []
    old_pcr_dict = {}
    for row in rows:
        project = projects.get(row["code"])
        if not project:
            logger.warning(
                f"⚠️ row {row['row_number']}: project with legacy code "
                f"{row['code']!r} not found"
            )
            continue
        if project.id not in old_pcr_dict:
            old_pcr_dict[project.id], _ = OLD_IndividualPCR.objects.get_or_create(
                project=project
            )
        result.append((row, old_pcr_dict[project.id]))
    return result


@transaction.atomic
def import_pcr_individual():
    file_path = get_dir_path() / PCR_INDIVIDUAL_FILE
    logger.info(f"⏳ importing old individual pcrs from {file_path}")

    OLD_IndividualPCRLearnedLesson.objects.filter(source_file=file_path.name).delete()

    lessons = []
    # the same lessons can be repeated on multiple rows of the same project
    imported_lessons = set()
    for row, old_pcr in get_rows_with_pcr(file_path):
        if not row["lessons"] or (old_pcr.id, row["lessons"]) in imported_lessons:
            continue
        imported_lessons.add((old_pcr.id, row["lessons"]))
        lessons.append(
            OLD_IndividualPCRLearnedLesson(
                old_individual_pcr=old_pcr,
                description=row["lessons"],
                report_filename=row["report"],
                source_file=file_path.name,
            )
        )

    OLD_IndividualPCRLearnedLesson.objects.bulk_create(lessons, batch_size=1000)
    logger.info(f"✔ old individual pcrs imported ({len(lessons)} learned lessons)")


def get_files_dict(dir_path):
    """
    @param dir_path = Path

    @return dict
        - struct: {file_key: file_path}
    """
    return {
        get_file_key(file_path.name): file_path
        for file_path in sorted(dir_path.iterdir())
        if file_path.is_file()
    }


def is_zip_entry_skipped(info):
    path = PurePath(info.filename)
    return (
        info.is_dir()
        or "__MACOSX" in path.parts
        or path.name.startswith(".")
        or not path.name
    )


def create_evidence(old_pcr, document_type, filename, source_file, content):
    evidence = OLD_IndividualPCRSupportingEvidence(
        old_individual_pcr=old_pcr,
        document_type=document_type,
        filename=filename,
        source_file=source_file,
    )
    evidence.file.save(filename, content, save=False)
    evidence.save()


def import_file(old_pcr, document_type, file_path):
    """
    Import a file as supporting evidence. The zip files are extracted, each
    file from the archive being imported separately.
    """
    if not zipfile.is_zipfile(file_path):
        with open(file_path, "rb") as f:
            create_evidence(
                old_pcr, document_type, file_path.name, file_path.name, File(f)
            )
        return

    with zipfile.ZipFile(file_path) as zf:
        for info in zf.infolist():
            if is_zip_entry_skipped(info):
                continue
            create_evidence(
                old_pcr,
                document_type,
                PurePath(info.filename).name,
                file_path.name,
                ContentFile(zf.read(info)),
            )


def delete_old_evidences():
    for evidence in OLD_IndividualPCRSupportingEvidence.objects.all():
        evidence.file.delete(save=False)
        evidence.delete()


@transaction.atomic
def import_pcr_individual_supporting_evidences():
    dir_path = get_dir_path()
    logger.info(f"⏳ importing old individual pcr files from {dir_path}")

    delete_old_evidences()

    document_dirs = {
        "report": (
            OLD_IndividualPCRSupportingEvidence.DocumentType.REPORT,
            get_files_dict(dir_path / REPORTS_DIR),
        ),
        "additional_document": (
            OLD_IndividualPCRSupportingEvidence.DocumentType.ADDITIONAL_DOCUMENT,
            get_files_dict(dir_path / ADDITIONAL_DOCUMENTS_DIR),
        ),
    }

    # the same file can be referenced on multiple rows of the same project
    imported_files = set()
    for row, old_pcr in get_rows_with_pcr(dir_path / PCR_INDIVIDUAL_FILE):
        for column, (document_type, files_dict) in document_dirs.items():
            if not row[column]:
                continue
            file_path = files_dict.get(get_file_key(row[column]))
            if not file_path:
                logger.warning(
                    f"⚠️ row {row['row_number']}: file {row[column]!r} not found"
                )
                continue
            if (old_pcr.id, file_path) in imported_files:
                continue
            imported_files.add((old_pcr.id, file_path))
            import_file(old_pcr, document_type, file_path)

    logger.info("✔ old individual pcr files imported")
