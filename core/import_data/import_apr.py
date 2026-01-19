import logging

import pandas as pd
from django.db import transaction
from django.db.models import Q

from core.models import (
    AnnualProgressReport,
    AnnualAgencyProjectReport,
    AnnualProjectReport,
    Project,
)
from core.api.serializers.annual_project_report import (
    AnnualProjectReportUpdateSerializer,
)

START_DATA_ROWS = 2

logger = logging.getLogger(__name__)

# pylint: disable=W0718,R1702,R0915


def import_apr_data(file_path, year, dry_run=False):
    # Get or create the top-level APR year container
    progress_report, created = AnnualProgressReport.objects.get_or_create(
        year=year,
        defaults={
            "endorsed": False,
            "remarks_endorsed": "",
        },
    )

    if created:
        logger.info(f"Created Annual Progress Report for year {year}")
    else:
        logger.info(f"Using existing Annual Progress Report for year {year}")

    df = pd.read_excel(file_path, header=0).replace({pd.NA: None})
    logger.info(f"Read {len(df)} rows from Excel file")

    stats = _process_rows(df, progress_report, dry_run)

    return stats


def _process_rows(df, progress_report, dry_run):
    stats = {
        "total": 0,
        "updated": 0,
        "created": 0,
        "no_legacy_code": 0,
        "not_found": 0,
        "errors": 0,
    }

    column_mapping = {
        "Status": "status",
        "Date First Disbursement": "date_first_disbursement",
        "Date Planned Completion": "date_planned_completion",
        "Date Actual Completion": "date_actual_completion",
        "Date Financial Completion": "date_financial_completion",
        "Consumption ODP/MT Phased Out": "consumption_phased_out_odp",
        "Consumption Phased Out CO2": "consumption_phased_out_co2",
        "Production ODP/MT Phased Out": "production_phased_out_odp",
        "Production Phased Out CO2": "production_phased_out_co2",
        "Funds Disbursed": "funds_disbursed",
        "Funds Committed": "funds_committed",
        "Estimated Disbursement Current Year": "estimated_disbursement_current_year",
        "Support Cost Disbursed": "support_cost_disbursed",
        "Support Cost Committed": "support_cost_committed",
        "Disbursements Made To Final Beneficiaries": "disbursements_made_to_final_beneficiaries",
        "Funds Advanced": "funds_advanced",
        "Last Year Remarks": "last_year_remarks",
        "Current Year Remarks": "current_year_remarks",
        "Gender Policy": "gender_policy",
    }

    for index, row in df.iterrows():
        stats["total"] += 1
        row_num = index + START_DATA_ROWS

        legacy_code = row.get("Legacy Code")
        project_code = row.get("Project Code")

        if (not legacy_code or pd.isna(legacy_code)) and (
            not project_code or pd.isna(project_code)
        ):
            stats["no_legacy_code"] += 1
            continue

        legacy_code = str(legacy_code).strip()

        try:
            project = Project.objects.filter(
                Q(legacy_code=legacy_code) | Q(code=project_code),
                version__gte=3,
            ).first()

            if not project:
                logger.info(
                    f"Row {row_num}: Project not found for legacy code '{legacy_code}'"
                )
                stats["not_found"] += 1
                continue

            # Get or create agency report to attach the project reports to
            agency_report, _ = AnnualAgencyProjectReport.objects.get_or_create(
                progress_report=progress_report,
                agency=project.agency,
                defaults={
                    "status": AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
                },
            )
            project_report = AnnualProjectReport.objects.filter(
                project=project,
                report=agency_report,
            ).first()

            data = {"project_code": project.code}

            for excel_col, field_name in column_mapping.items():
                value = row.get(excel_col)

                if value is not None and not pd.isna(value):
                    if isinstance(value, pd.Timestamp):
                        value = value.date()
                    elif hasattr(value, "item"):
                        value = value.item()

                    if field_name == "gender_policy":
                        if isinstance(value, str):
                            value = value.lower() in ("yes", "y", "true", "1")
                        else:
                            value = bool(value)

                    data[field_name] = value

            if not dry_run:
                with transaction.atomic():
                    if project_report:
                        # Project report already existing, just update it
                        # (including derived fields!)
                        serializer = AnnualProjectReportUpdateSerializer(
                            instance=project_report,
                            data=data,
                            partial=True,
                        )
                        if serializer.is_valid():
                            serializer.save()
                            project_report.populate_derived_fields()
                            project_report.save()
                            stats["updated"] += 1
                        else:
                            logger.info(
                                f"Row {row_num}, {legacy_code}: Validation error - {serializer.errors}"
                            )
                            stats["errors"] += 1
                    else:
                        # New project report
                        project_report = AnnualProjectReport.objects.create(
                            project=project,
                            report=agency_report,
                        )
                        serializer = AnnualProjectReportUpdateSerializer(
                            instance=project_report,
                            data=data,
                            partial=True,
                        )
                        if serializer.is_valid():
                            serializer.save()
                            project_report.populate_derived_fields()
                            project_report.save()
                            stats["created"] += 1
                        else:
                            logger.info(
                                f"Row {row_num}, {legacy_code}: Validation error - {serializer.errors}"
                            )
                            stats["errors"] += 1
            else:
                # In dry-run mode, just counting how many would get updated or created
                if project_report:
                    stats["updated"] += 1
                else:
                    stats["created"] += 1

        except Exception as e:
            logger.info(f"Row {row_num}, {legacy_code}: Error - {str(e)}")
            stats["errors"] += 1
            logger.exception(f"Error processing row {row_num}")

    return stats
