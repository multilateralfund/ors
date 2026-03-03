"""
Management command to export all projects as an APR Annex I Excel file.

Generates an Excel file identical in structure to the APRExportWriter output,
but based on ALL PROJECTS in the database. APR input fields (funds disbursed,
actual phaseout, remarks, etc.) are left empty since no APR records are used.

Derived fields (identification, dates, financial proposals, phaseout proposals)
are computed in-memory using AnnualProjectReport.populate_derived_fields()
without persisting any APR records to the database.
"""

from datetime import date, datetime

from django.core.management import BaseCommand
from django.db.models import Prefetch, Q

from core.api.export.annual_project_report import APRExportWriter
from core.api.serializers.annual_project_report import (
    AnnualProjectReportReadSerializer,
)
from core.models import AnnualProjectReport, Project


# Fields excluded from the export.
EXCLUDE_FIELDS = {"pcr_due"}

# Mapping from serializer excel field names to APR denormalized attribute names.
# All APR input fields are not in the mapping (they're left as None).
DENORM_FIELD_MAP = {
    "meta_code": "meta_code_denorm",
    "project_code": "project_code_denorm",
    "legacy_code": "legacy_code_denorm",
    "agency_name": "agency_name_denorm",
    "cluster_name": "cluster_name_denorm",
    "region_name": "region_name_denorm",
    "country_name": "country_name_denorm",
    "type_code": "type_code_denorm",
    "sector_code": "sector_code_denorm",
    "project_title": "project_title_denorm",
    "date_approved": "date_approved_denorm",
    "date_completion_proposal": "date_completion_proposal_denorm",
    "consumption_phased_out_odp_proposal": "consumption_phased_out_odp_proposal_denorm",
    "consumption_phased_out_mt_proposal": "consumption_phased_out_mt_proposal_denorm",
    "consumption_phased_out_co2_proposal": "consumption_phased_out_co2_proposal_denorm",
    "production_phased_out_odp_proposal": "production_phased_out_odp_proposal_denorm",
    "production_phased_out_mt_proposal": "production_phased_out_mt_proposal_denorm",
    "production_phased_out_co2_proposal": "production_phased_out_co2_proposal_denorm",
    "approved_funding": "approved_funding_denorm",
    "adjustment": "adjustment_denorm",
    "approved_funding_plus_adjustment": "approved_funding_plus_adjustment_denorm",
    "support_cost_approved": "support_cost_approved_denorm",
    "support_cost_adjustment": "support_cost_adjustment_denorm",
    "support_cost_approved_plus_adjustment": "support_cost_approved_plus_adjustment_denorm",
    "implementation_delays_status_report_decisions": "implementation_delays_status_report_decisions_denorm",
    "date_of_completion_per_agreement_or_decisions": "date_of_completion_per_agreement_or_decisions_denorm",
}


def _build_project_dict(apr):
    """
    Build a dict matching the serializer's excel_fields from a populated
    in-memory AnnualProjectReport instance.
    """
    excel_fields = AnnualProjectReportReadSerializer.Meta.excel_fields
    data = {}

    for field_name in excel_fields:
        if field_name in DENORM_FIELD_MAP:
            value = getattr(apr, DENORM_FIELD_MAP[field_name], None)
            # Convert date objects to ISO format strings for the export writer
            if isinstance(value, (date, datetime)):
                value = value.isoformat()
            data[field_name] = value
        elif field_name == "status":
            data[field_name] = apr.status
        else:
            # APR input fields — left empty (no APR records exist)
            data[field_name] = None

    return data


def _generate_project_dicts(projects, year):
    """
    Generator that yields one APR-style dict per project.

    For each project, creates an in-memory (unsaved) AnnualProjectReport,
    overrides report_year, calls populate_derived_fields(), and extracts
    a dict matching the serializer's excel_fields structure.
    """
    for project in projects:
        # pcr_due checks cached_versions_for_year (a different attribute from
        # cached_archive_versions_for_year). Alias it so the property can find
        # the prefetched data without making an extra DB query.
        if hasattr(project, "cached_archive_versions_for_year"):
            project.cached_versions_for_year = project.cached_archive_versions_for_year

        apr = AnnualProjectReport(project=project)
        apr.project_id = project.id

        # Set status from the project's current status
        apr.status = project.status.name if project.status else ""

        # Override the report_year cached_property so version lookups
        # (latest_project_version_for_year, pcr_due, etc.) use the right year
        # without needing a real Report/ProgressReport chain.
        apr.__dict__["report_year"] = year

        # Compute all derived/denormalized fields from the project
        apr.populate_derived_fields()

        yield _build_project_dict(apr)


class Command(BaseCommand):
    help = (
        "Export ALL projects as an APR Annex I Excel file. "
        "APR input fields are left empty. Saves file to the current directory."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--year",
            type=int,
            default=None,
            help=(
                "Year used for project version lookups "
                "(e.g. adjustment, PCR due). Defaults to current year."
            ),
        )
        parser.add_argument(
            "--output",
            type=str,
            default=None,
            help="Output file path. Defaults to APR_All_Projects_<year>.xlsx",
        )

    def handle(self, *args, **options):
        year = options["year"] or datetime.now().year
        output = options["output"] or f"APR_All_Projects_{year}.xlsx"

        self.stdout.write(f"Querying all projects (version year: {year})...")

        projects = self._get_projects_queryset(year)
        total = projects.count()
        self.stdout.write(f"Found {total} projects. Building export data...")

        project_data = list(_generate_project_dicts(projects, year))

        self.stdout.write(f"Writing {len(project_data)} rows to {output}...")

        def _write_progress(rows_written, total):
            self.stdout.write(f"  {rows_written}/{total} rows written...")

        writer = APRExportWriter(
            year=year,
            agency_name=None,
            project_reports_data=project_data,
            exclude_fields=EXCLUDE_FIELDS,
            progress_callback=_write_progress,
        )
        writer.generate_to_file(output)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Exported {len(project_data)} projects to {output}"
            )
        )

    def _get_projects_queryset(self, year):
        """
        Query all current (non-archived) projects with the related data and
        prefetched version archives needed by populate_derived_fields.
        """
        # Version 3 archives — needed for most fields. Also ods_odp
        version_3_prefetch = Prefetch(
            "archive_projects",
            queryset=(
                Project.objects.really_all()
                .filter(version=3)
                .select_related("status", "post_excom_decision__meeting")
                .prefetch_related(
                    "ods_odp",
                    "ods_odp__ods_substance",
                    "ods_odp__ods_blend",
                )
            ),
            to_attr="cached_version_3_list",
        )

        # Archive versions up to the given year
        archive_versions_prefetch = Prefetch(
            "archive_projects",
            queryset=(
                Project.objects.really_all()
                .filter(
                    post_excom_decision__isnull=False,
                    post_excom_decision__meeting__date__year__lte=year,
                )
                .select_related("status", "post_excom_decision__meeting")
                .order_by("-post_excom_decision__meeting__date", "-version")
            ),
            to_attr="cached_archive_versions_for_year",
        )

        # All versions created during the year — needed by pcr_due
        all_versions_year_prefetch = Prefetch(
            "archive_projects",
            queryset=(
                Project.objects.really_all()
                .filter(
                    Q(
                        post_excom_decision__isnull=False,
                        post_excom_decision__meeting__date__year=year,
                    )
                    | Q(post_excom_decision__isnull=True, version=3)
                )
                .select_related("status")
            ),
            to_attr="cached_all_versions_for_year",
        )

        return (
            Project.objects.select_related(
                "agency",
                "country",
                "country__parent",
                "cluster",
                "sector",
                "project_type",
                "status",
                "post_excom_decision__meeting",
            )
            .prefetch_related(
                version_3_prefetch,
                archive_versions_prefetch,
                all_versions_year_prefetch,
            )
            .order_by("code")
        )
