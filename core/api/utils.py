import io
import shutil
import subprocess
import tempfile
from pathlib import Path

from django.db.models import Exists
from django.db.models import OuterRef
from django.http import FileResponse
from django_filters import rest_framework as filters

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
    xls = io.BytesIO()
    wb.save(xls)
    xls.seek(0)
    return FileResponse(xls, as_attachment=True, filename=name + ".xlsx")


def workbook_pdf_response(name, wb):
    """Save pdf and return the response"""

    with tempfile.TemporaryDirectory(prefix="mlf-print-") as tmpdirname:
        pdf_file = Path(tmpdirname) / (name + ".pdf")
        xlsx_file = Path(tmpdirname) / (name + ".xlsx")
        wb.save(xlsx_file)

        libreoffice_bin = shutil.which("libreoffice")
        subprocess.check_call(
            [libreoffice_bin, "--headless", "--convert-to", "pdf", str(xlsx_file)],
            cwd=tmpdirname,
            shell=False,
        )
        return FileResponse(
            pdf_file.open("rb"),
            as_attachment=True,
            filename=name + ".pdf",
        )
