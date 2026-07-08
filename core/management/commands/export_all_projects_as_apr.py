"""
Management command to export all projects as an APR Annex I Excel file.

Generates an Excel file identical in structure to the APRExportWriter output,
but based on ALL PROJECTS in the database. APR input fields (funds disbursed,
actual phaseout, remarks, etc.) are left empty since no APR records are used.

Derived fields (identification, dates, financial proposals, phaseout proposals)
are computed in-memory using AnnualProjectReport.populate_derived_fields()
without persisting any APR records to the database, unless --write-to-db is
passed, in which case the container models (AnnualProgressReport and
AnnualAgencyProjectReport) are created as needed and each AnnualProjectReport
is saved to the database.
"""

from datetime import date, datetime

from django.core.management import BaseCommand
from django.db import transaction
from django.db.models import Q

from core.api.export.annual_project_report import APRExportWriter
from core.api.serializers.annual_project_report import (
    AnnualProjectReportReadSerializer,
)
from core.api.utils import all_versions_for_year_base_qs, latest_version_base_qs
from core.models import (
    AnnualAgencyProjectReport,
    AnnualProgressReport,
    AnnualProjectReport,
    Project,
)


# Fields excluded from the export.
EXCLUDE_FIELDS = {"pcr_due"}

# Calculated fields - not stored as "denorm" fields, but computable after
# populate_derived_fields() populates them
COMPUTED_FIELDS = {
    "per_cent_funds_disbursed",
    "balance",
    "support_cost_balance",
}

# Mapping from serializer excel field names to APR denormalized attribute names.
# All APR input fields are not in the mapping (they're left as None).
DENORM_FIELD_MAP = {
    "meta_code": "meta_code_denorm",
    "project_code": "project_code_denorm",
    "legacy_code": "legacy_code_denorm",
    "agency_name": "agency_name_denorm",
    "cluster_name": "cluster_name_denorm",
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
            denorm_attr = DENORM_FIELD_MAP[field_name]
            value = getattr(apr, denorm_attr, None)
            # Convert date objects to ISO format strings for the export writer
            if isinstance(value, (date, datetime)):
                value = value.isoformat()
            data[field_name] = value
        elif field_name == "region_name":
            data[field_name] = apr.main_region.name if apr.main_region else None
        elif field_name in COMPUTED_FIELDS:
            data[field_name] = getattr(apr, field_name, None)
        elif field_name == "status":
            data[field_name] = apr.status
        else:
            # APR input fields — left empty (no APR records exist)
            data[field_name] = None

    return data


def _attach_version_cache(projects_list, year):
    """
    Attach cached_version_3_list, cached_versions_for_year, and
    cached_all_versions_for_year to each project in projects_list.

    Mirrors the bulk-prefetch logic in the workspace view, so populate_derived_fields()
    uses the same effective_date-based version lookups, avoiding extra per-row DB hits.
    """
    if not projects_list:
        return

    project_ids = [p.id for p in projects_list]
    project_id_filter = Q(id__in=project_ids) | Q(latest_project_id__in=project_ids)

    version_3_map = {}
    for v3 in (
        Project.objects.really_all()
        .filter(project_id_filter, version=3)
        .select_related("status", "post_excom_decision__meeting")
    ):
        key = v3.latest_project_id or v3.id
        version_3_map[key] = v3

    latest_version_map = {}
    for p in latest_version_base_qs(year).filter(project_id_filter):
        key = p.latest_project_id or p.id
        if key not in latest_version_map:
            latest_version_map[key] = p

    previous_version_map = {}
    for p in latest_version_base_qs(year - 1).filter(project_id_filter):
        key = p.latest_project_id or p.id
        if key not in previous_version_map:
            previous_version_map[key] = p

    all_versions_map: dict = {}
    for p in all_versions_for_year_base_qs(year).filter(project_id_filter):
        key = p.latest_project_id or p.id
        all_versions_map.setdefault(key, []).append(p)

    for project in projects_list:
        project_key = project.latest_project_id or project.id
        project.cached_version_3_list = (
            [version_3_map[project_key]]
            if project_key in version_3_map
            else ([project] if project.version == 3 else [])
        )
        project.cached_versions_for_year = (
            [latest_version_map[project_key]]
            if project_key in latest_version_map
            else []
        )
        project.cached_previous_versions_for_year = (
            [previous_version_map[project_key]]
            if project_key in previous_version_map
            else []
        )
        project.cached_all_versions_for_year = all_versions_map.get(project_key, [])


def _generate_project_dicts(projects_list, year):
    """
    Generator that yields one APR-style dict per project.

    Expects projects_list to already have cached_version_3_list,
    cached_versions_for_year, and cached_all_versions_for_year attached,
    so populate_derived_fields() uses effective_date-based version lookups.
    """
    for project in projects_list:
        apr = AnnualProjectReport(project=project)
        apr.project_id = project.id
        apr.status = project.status.name if project.status else ""
        # report_year is a cached_property that normally reads from apr.report;
        # inject it directly since these APR objects are never persisted.
        apr.__dict__["report_year"] = year
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
                "Year used for the APR report and output file name. "
                "Defaults to current year. When --write-to-db is set this "
                "determines which AnnualProgressReport container is used."
            ),
        )
        parser.add_argument(
            "--output",
            type=str,
            default=None,
            help="Output file path. Defaults to APR_All_Projects_<year>.xlsx",
        )
        parser.add_argument(
            "--write-to-db",
            action="store_true",
            default=False,
            help=(
                "Saves the generated AnnualProjectReport objects to the database. "
                "Creates the needed APR containers if they don't exist. "
                "Skips projects that already have an APR for the target report. "
                "Default: False (Excel export only)."
            ),
        )

    def handle(self, *args, **options):
        year = options["year"] or datetime.now().year
        write_to_db = options["write_to_db"]
        output = options["output"] or f"APR_All_Projects_{year}.xlsx"

        self.stdout.write("Querying all projects...")
        projects_list = list(self._get_projects_queryset(year))
        total = len(projects_list)
        self.stdout.write(f"Found {total} projects.")

        self.stdout.write("Prefetching version data...")
        _attach_version_cache(projects_list, year)

        if write_to_db:
            self.stdout.write("Writing APR records to DB (skipping Excel export)...")
            self._commit_aprs_to_db(projects_list, year)
        else:
            self.stdout.write("Building export data...")
            project_data = list(_generate_project_dicts(projects_list, year))

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

    def _commit_aprs_to_db(self, projects_list, year):
        """
        Save AnnualProjectReport records to the database.

        get_or_create an AnnualProgressReport for `year`,
        then get_or_create one AnnualAgencyProjectReport per agency,
        and finally create an AnnualProjectReport for every project that doesn't have one.

        Expects projects_list to already have version caches attached via
        _attach_version_cache().
        """
        with transaction.atomic():
            progress_report, created = AnnualProgressReport.objects.get_or_create(
                year=year,
                defaults={"remarks_endorsed": "", "endorsed": False},
            )
            action = "Created" if created else "Found existing"
            self.stdout.write(f"{action} AnnualProgressReport for year {year}.")

            # Pre-create one AnnualAgencyProjectReport for each distinct agency
            seen_agency_ids = {p.agency_id for p in projects_list}
            agency_reports: dict = {}
            for agency_id in seen_agency_ids:
                agency_report, _ = AnnualAgencyProjectReport.objects.get_or_create(
                    progress_report=progress_report,
                    agency_id=agency_id,
                    defaults={
                        "status": AnnualAgencyProjectReport.SubmissionStatus.DRAFT
                    },
                )
                agency_reports[agency_id] = agency_report
            self.stdout.write(
                f"Ensured {len(agency_reports)} AnnualAgencyProjectReport(s)."
            )

            # Collect project IDs that already have an APR in this report to
            # avoid unique-constraint violations without an extra per-row query.
            existing_project_ids = set(
                AnnualProjectReport.objects.filter(
                    report__progress_report=progress_report
                ).values_list("project_id", flat=True)
            )

            to_create = []
            num_skipped = 0
            for project in projects_list:
                if project.id in existing_project_ids:
                    num_skipped += 1
                    continue

                apr = AnnualProjectReport(
                    project=project,
                    report=agency_reports[project.agency_id],
                )
                apr.project_id = project.id
                apr.status = project.status.name if project.status else ""
                apr.__dict__["report_year"] = year
                apr.populate_derived_fields()
                to_create.append(apr)

            AnnualProjectReport.objects.bulk_create(to_create, batch_size=500)
            num_created = len(to_create)

        self.stdout.write(
            self.style.SUCCESS(
                f"DB write complete: {num_created} APR(s) created, "
                f"{num_skipped} already existed."
            )
        )

    def _get_projects_queryset(self, year):
        """
        Query approved (version >= 3), current (non-archived) projects that were
        approved on or before `year`, with the related data needed by
        populate_derived_fields.

        Mirrors the APRProjectFilter.filter_by_year logic from the workspace view:
        include a project if its own date_approved year <= year, OR if any of its
        version-3 archives has date_approved year <= year.
        """
        return (
            Project.objects.filter(
                version__gte=3,
            )
            .filter(
                Q(date_approved__year__lte=year)
                | Q(
                    archive_projects__version=3,
                    archive_projects__date_approved__year__lte=year,
                )
            )
            .select_related(
                "agency",
                "country",
                "country__parent",
                "country__parent__parent",
                "cluster",
                "sector",
                "project_type",
                "status",
                "post_excom_decision__meeting",
                "meta_project",
            )
            .distinct()
            .order_by("code")
        )
