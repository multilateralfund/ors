"""
Generates the file of a PCR bulk export (see the `generate_pcr_export` task).

PDF and Word: a ZIP with one file per PCR; the legacy PCRs are added as their
original PDFs. Excel: one workbook with the data of all the PCRs; the legacy PCRs
are only listed as not included.
"""

import re
import tempfile
import zipfile
from datetime import date
from pathlib import Path

from django.core.files import File
from django.db.models import Prefetch

from core.api.export.pcr.as_docx import render_docx
from core.api.export.pcr.as_pdf import render_pdf
from core.api.export.pcr.as_xlsx import PCRWorkbookBuilder
from core.api.export.pcr.sections import PCRDocumentBuilder
from core.api.views.project_completion_report.utils import (
    filter_pcr_projects_permissions,
)
from core.models import MetaProject, Project
from core.models.annual_project_report import AnnualProjectReport
from core.models.project_completion_report import (
    OLD_IndividualPCRSupportingEvidence,
    PCR,
    PCRDelayCause,
    PCRDelayCauseRootCause,
    PCRExport,
    PCRLearnedLesson,
    PCRLearnedLessonDescription,
    PCRSustainableDevelopmentGoal,
    PCRSustainableDevelopmentGoalDescription,
)

# The meta projects are loaded (and their PCRs rendered) in chunks, to limit the
# memory used by large exports
CHUNK_SIZE = 50

RENDERERS = {
    PCRExport.OutputFormat.PDF: render_pdf,
    PCRExport.OutputFormat.DOCX: render_docx,
}

LEGACY_NOT_INCLUDED_REASON = (
    "Legacy PCR, only available as the original PDF (PDF or Word export)"
)


def export_pcr_queryset():
    """The current PCR versions, with all the data used in the export"""
    return PCR.objects.prefetch_related(
        "decisions",
        "additional_comments",
        "overall_assessment_highlights__agency",
        Prefetch(
            "delay_causes",
            queryset=PCRDelayCause.objects.select_related(
                "agency", "delay_cluster"
            ).prefetch_related(
                Prefetch(
                    "pcrdelaycauserootcause_set",
                    queryset=PCRDelayCauseRootCause.objects.select_related(
                        "root_cause"
                    ).order_by("id"),
                )
            ),
        ),
        Prefetch(
            "learned_lessons",
            queryset=PCRLearnedLesson.objects.select_related("agency").prefetch_related(
                Prefetch(
                    "pcrlearnedlessondescription_set",
                    queryset=PCRLearnedLessonDescription.objects.select_related(
                        "lesson"
                    ).order_by("lesson__sort_order", "id"),
                )
            ),
        ),
        "future_project_recommendations__agency",
        "gender_mainstreamings__agency",
        Prefetch(
            "sustainable_development_goals",
            queryset=PCRSustainableDevelopmentGoal.objects.select_related(
                "agency"
            ).prefetch_related(
                Prefetch(
                    "pcrsustainabledevelopmentgoaldescription_set",
                    queryset=PCRSustainableDevelopmentGoalDescription.objects.select_related(
                        "goal"
                    ).order_by(
                        "goal__sort_order", "id"
                    ),
                )
            ),
        ),
        "supporting_evidences__agency",
        "supporting_evidences__section",
        "pcr_projects__alternative_technologies__substance_from",
        "pcr_projects__alternative_technologies__substance_to",
        "pcr_projects__enterprises",
        "pcr_projects__equipments",
    )


def _meta_projects_queryset():
    return MetaProject.objects.select_related(
        "country", "lead_agency", "old_pcr"
    ).prefetch_related(
        Prefetch("pcrs", queryset=export_pcr_queryset(), to_attr="current_pcrs"),
        "old_pcr__supporting_evidences",
        Prefetch(
            "projects",
            queryset=Project.objects.filter(old_individual_pcr__isnull=False)
            .select_related("old_individual_pcr")
            .prefetch_related(
                Prefetch(
                    "old_individual_pcr__supporting_evidences",
                    queryset=OLD_IndividualPCRSupportingEvidence.objects.filter(
                        document_type=OLD_IndividualPCRSupportingEvidence.DocumentType.REPORT
                    ).order_by("id"),
                )
            )
            .order_by("id"),
            to_attr="projects_with_old_individual_pcr",
        ),
    )


def _projects_by_meta_project(user, meta_project_ids):
    """
    The projects of the meta projects visible to the user in the PCR view
    """
    projects = (
        filter_pcr_projects_permissions(user, Project.objects.for_pcr())
        .filter(meta_project_id__in=meta_project_ids)
        .select_related("agency", "sector", "status")
        .prefetch_related(
            Prefetch(
                "annual_reports",
                queryset=AnnualProjectReport.objects.filter(
                    report__progress_report__endorsed=True
                )
                .select_related("report__progress_report")
                .order_by("-report__progress_report__year"),
                to_attr="prefetched_endorsed_aprs",
            )
        )
        .order_by("code", "id")
    )
    result = {}
    for project in projects:
        result.setdefault(project.meta_project_id, []).append(project)
    return result


def iter_meta_projects(export: PCRExport):
    """
    The exported meta projects, in order, with their projects visible to the user.
    They are loaded in chunks.
    """
    meta_project_ids = export.meta_project_ids
    for start in range(0, len(meta_project_ids), CHUNK_SIZE):
        chunk = meta_project_ids[start : start + CHUNK_SIZE]
        meta_projects = _meta_projects_queryset().in_bulk(chunk)
        projects = _projects_by_meta_project(export.created_by, chunk)
        for meta_project_id in chunk:
            if meta_project_id in meta_projects:
                yield (
                    meta_projects[meta_project_id],
                    projects.get(meta_project_id, []),
                )


def legacy_pcr_files(meta_project):
    """The original PDFs of the legacy PCR(s) of the meta project"""
    old_pcr = getattr(meta_project, "old_pcr", None)
    if old_pcr:
        return [evidence.file for evidence in old_pcr.supporting_evidences.all()]
    return [
        evidence.file
        for project in meta_project.projects_with_old_individual_pcr
        for evidence in project.old_individual_pcr.supporting_evidences.all()
    ]


def _safe_filename(name):
    return re.sub(r'[\\/:*?"<>|\s]+', " ", name).strip()


class _ZipNames:
    """Unique names for the files in the ZIP"""

    def __init__(self):
        self.used = set()

    def get(self, name, extension):
        candidate = f"{name}{extension}"
        counter = 2
        while candidate.lower() in self.used:
            candidate = f"{name} ({counter}){extension}"
            counter += 1
        self.used.add(candidate.lower())
        return candidate


def _document_name(meta_project, suffix=""):
    parts = [
        meta_project.umbrella_code,
        meta_project.country.name if meta_project.country else None,
        meta_project.lead_agency.name if meta_project.lead_agency else None,
        suffix,
    ]
    return _safe_filename(" - ".join(part for part in parts if part))


def _write_zip(export, path):
    render = RENDERERS[export.output_format]
    names = _ZipNames()
    missing = []
    # Stored, not compressed: PDF and Word files are already compressed
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_STORED) as zip_file:
        for meta_project, projects in iter_meta_projects(export):
            if meta_project.current_pcrs:
                document = PCRDocumentBuilder(
                    meta_project.current_pcrs[0], projects
                ).build(export.sections)
                name = names.get(
                    _document_name(meta_project), f".{export.output_format}"
                )
                zip_file.writestr(name, render(document))
                continue

            files = [
                file
                for file in legacy_pcr_files(meta_project)
                if file and file.storage.exists(file.name)
            ]
            if not files:
                missing.append(_document_name(meta_project))
            for file in files:
                name = names.get(
                    _document_name(meta_project, "legacy PCR"),
                    Path(file.name).suffix or ".pdf",
                )
                with file.open("rb") as source, zip_file.open(name, "w") as target:
                    while chunk := source.read(1024 * 1024):
                        target.write(chunk)

        if missing:
            zip_file.writestr(
                "missing_files.txt",
                "The original PDF is not available for these legacy PCRs:\n\n"
                + "\n".join(missing)
                + "\n",
                compress_type=zipfile.ZIP_DEFLATED,
            )


def _write_xlsx(export, path):
    builder = PCRWorkbookBuilder(export.sections)
    for meta_project, projects in iter_meta_projects(export):
        if meta_project.current_pcrs:
            document = PCRDocumentBuilder(meta_project.current_pcrs[0], projects).build(
                export.sections
            )
            builder.add(document)
        else:
            builder.add_not_included(
                meta_project.umbrella_code,
                meta_project.country.name if meta_project.country else None,
                meta_project.lead_agency.name if meta_project.lead_agency else None,
                LEGACY_NOT_INCLUDED_REASON,
            )
    Path(path).write_bytes(builder.render())


def generate_pcr_export(export: PCRExport):
    """Generates the export file and saves it on the export"""
    is_xlsx = export.output_format == PCRExport.OutputFormat.XLSX
    extension = ".xlsx" if is_xlsx else ".zip"
    filename = f"PCR export {date.today().isoformat()}{extension}"

    with tempfile.TemporaryDirectory(prefix="mlf-pcr-export-") as tmp_dir:
        path = Path(tmp_dir) / f"export{extension}"
        if is_xlsx:
            _write_xlsx(export, path)
        else:
            _write_zip(export, path)
        with path.open("rb") as export_file:
            export.file.save(f"{export.id}{extension}", File(export_file), save=False)
    export.filename = filename
