import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import TypedDict

import django.core.exceptions
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model
from django.db.models import Exists
from django.db.models import OuterRef
from django.http import FileResponse
from django_filters import rest_framework as filters

from django_clamd.validators import validate_file_infection
from openpyxl.worksheet.page import PageMargins

User = get_user_model()

COUNTRY_USER_GROUP = "CP - Country user"
COUNTRY_SUBMITTER_GROUP = "CP - Country submitter"

AGENCY_INPUTTER_GROUP = "Projects - Agency inputter"
AGENCY_SUBMITTER_GROUP = "Projects - Agency submitter"

SECTION_ANNEX_MAPPING = {
    "A": ["A", "B", "C", "D", "E"],
    "B": ["F"],
    "C": ["C", "F", "unknown"],
}

SECTION_GROUP_MAPPING_12_18 = [
    # 2012-2018 only substances under Annex B Group III, Annex C Group I and Annex E
    "Annex B, Group III",
    "Annex C, Group I",
    "Annex E, Group I",
]

SUBMISSION_STATUSE_CODES = ["NEWSUB", "UNK"]

PROJECT_SECTOR_TYPE_MAPPING = {
    # sector code: available project types
    "PMU": ["TAS"],
    "TAS": ["TAS"],
}

PROJECT_SUBSTANCES_ACCEPTED_ANNEXES = [
    "Annex C, Group I",
    "Annex F",
]


class RelatedExistsFilter(filters.BooleanFilter):
    """Filter query based on whether it has at least one row in the specified related field."""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault(
            "help_text",
            (
                f"If true list only entries that have at least one related {kwargs['field_name']}; "
                f"if false list entries without any related rows."
            ),
        )
        super().__init__(*args, **kwargs)

    def filter(self, qs, value):
        if value is None:
            return qs

        # The relationship between the two models used for filtering
        rel = getattr(qs.model, self.field_name).rel
        # The related model
        related_model = rel.related_model
        # Related field pk usually "id"
        related_field_ref = rel.field_name
        # The name of the FK in the related model, used for filtering
        related_field_name = rel.field.name

        subquery = Exists(
            related_model.objects.filter(
                **{related_field_name: OuterRef(related_field_ref)}
            )
        )
        if value:
            return qs.filter(subquery)
        return qs.exclude(subquery)


def workbook_response(name, wb):
    """Save xlsx and return the response"""
    with tempfile.TemporaryDirectory(prefix="mlf-export-") as tmpdirname:
        xlsx_file = Path(tmpdirname) / (name + ".xlsx")
        wb.save(xlsx_file)
        res = FileResponse(
            xlsx_file.open("rb"), as_attachment=True, filename=name + ".xlsx"
        )
        return res


def workbook_pdf_response(name, wb, orientation=None):
    """Save pdf and return the response"""

    with tempfile.TemporaryDirectory(prefix="mlf-print-") as tmpdirname:
        pdf_file = Path(tmpdirname) / (name + ".pdf")
        xlsx_file = Path(tmpdirname) / (name + ".xlsx")

        if orientation:
            for sheet in wb.worksheets:
                sheet.page_setup.orientation = sheet.ORIENTATION_LANDSCAPE
                sheet.page_margins = PageMargins(
                    left=0.5, right=0.5, top=0.75, bottom=0.75
                )

        wb.save(xlsx_file)

        libreoffice_bin = shutil.which("libreoffice")
        subprocess.check_call(
            [
                libreoffice_bin,
                "--headless",
                "--convert-to",
                "pdf",
                str(xlsx_file),
            ],
            cwd=tmpdirname,
            shell=False,
        )
        return FileResponse(
            pdf_file.open("rb"),
            as_attachment=True,
            filename=name + ".pdf",
        )


FileValidationError = TypedDict("FileValidationError", {"name": str, "error": str})
FilesValidatorError = TypedDict(
    "FilesValidatorError", {"validation_error": str, "files": list[FileValidationError]}
)


def validate_file(obj: ContentFile) -> FileValidationError | None:
    result = None

    try:
        validate_file_infection(obj)
    except django.core.exceptions.ValidationError as err:
        result = {
            "name": obj.name,
            "error": err.message,
        }

    return result


def validate_files(files: list[ContentFile]) -> FilesValidatorError | None:
    errors = []

    for entry in files:
        validation_result = validate_file(entry)
        if validation_result:
            errors.append(validation_result)
    return {"validation_error": "Virus found!", "files": errors} if errors else None
