from copy import copy
from datetime import datetime
from dateutil.relativedelta import relativedelta
from decimal import Decimal
from io import BytesIO

from django.conf import settings
from django.db.models import Count, Sum, Q
from django.db.models.functions import ExtractYear
from django.http import HttpResponse
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

from core.api.serializers.annual_project_report import AnnualProjectReportReadSerializer
from core.models import AnnualProjectReport, ProjectStatus

# pylint: disable=R0902,R0911,R0913,R0914,R0915,W0212


class APRExportWriter:
    """
    Generates Excel export for APR using Annex I template.
    """

    TEMPLATE_PATH = (
        settings.ROOT_DIR / "api" / "export" / "templates" / "APRAnnexI.xlsx"
    )
    SHEET_NAME = "Annex I APR report "
    STATUS_SHEET_NAME = "Status Values"
    # Last header row
    HEADER_ROW = 2
    FIRST_DATA_ROW = 3

    DATE_FORMAT = "dd/mm/yyyy"

    DATE_FIELDS = {
        "date_approved",
        "date_completion_proposal",
        "date_first_disbursement",
        "date_planned_completion",
        "date_actual_completion",
        "date_financial_completion",
        "date_of_completion_per_agreement_or_decisions",
    }

    NUMERIC_FIELDS = {
        "consumption_phased_out_odp_proposal",
        "consumption_phased_out_co2_proposal",
        "production_phased_out_odp_proposal",
        "production_phased_out_co2_proposal",
        "consumption_phased_out_odp",
        "consumption_phased_out_co2",
        "production_phased_out_odp",
        "production_phased_out_co2",
        "approved_funding",
        "adjustment",
        "approved_funding_plus_adjustment",
        "per_cent_funds_disbursed",
        "balance",
        "support_cost_approved",
        "support_cost_adjustment",
        "support_cost_approved_plus_adjustment",
        "support_cost_balance",
        "funds_disbursed",
        "funds_committed",
        "estimated_disbursement_current_year",
        "support_cost_disbursed",
        "support_cost_committed",
        "disbursements_made_to_final_beneficiaries",
        "funds_advanced",
    }

    PERCENTAGE_FIELDS = {
        "per_cent_funds_disbursed",
    }

    BOOLEAN_FIELDS = {
        "pcr_due",
        "gender_policy",
    }

    @classmethod
    def build_column_mapping(cls):
        """
        Generate column index-to-field mapping from serializer's excel_fields.
        This ensures consistency between serializer and Excel export.
        """
        excel_fields = AnnualProjectReportReadSerializer.Meta.excel_fields
        # Map fields to column numbers (1-indexed)
        return {field: idx + 1 for idx, field in enumerate(excel_fields)}

    def __init__(self, year, agency_name=None, project_reports_data=None):
        """
        If agency_name is None, the report includes all agencies
        """
        self.year = year
        self.agency_name = agency_name
        self.project_reports_data = project_reports_data or []
        self.workbook = None
        self.worksheet = None
        self.status_worksheet = None
        self.column_mapping = self.build_column_mapping()
        self.status_column_idx = None

        # Find the status column index
        for field, idx in self.column_mapping.items():
            if field == "status":
                self.status_column_idx = idx
                break

    def generate(self):
        self.workbook = load_workbook(str(self.TEMPLATE_PATH))
        self.worksheet = self.workbook[self.SHEET_NAME]

        # Remove hidden sheets & extra columns; create status reference sheet
        self._remove_hidden_sheets()
        self._remove_extra_columns()
        self._create_status_sheet()

        # Write data rows
        self._write_data_rows()

        # Apply cell formatting (dates, numbers, booleans)
        self._apply_cell_formatting()

        # Apply data validation (status dropdown)
        self._apply_data_validation()

        return self._create_response()

    def _remove_hidden_sheets(self):
        """
        Removes all hidden sheets from the template - except the ones we want to keep.
        """
        sheets_to_keep = {self.SHEET_NAME, self.STATUS_SHEET_NAME}
        sheets_to_remove = []

        for sheet_name in self.workbook.sheetnames:
            sheet = self.workbook[sheet_name]
            if sheet.sheet_state == "hidden" and sheet_name not in sheets_to_keep:
                sheets_to_remove.append(sheet_name)

        for sheet_name in sheets_to_remove:
            del self.workbook[sheet_name]

    def _remove_extra_columns(self):
        """
        Remove any extra columns - ensures only our data columns are exported.
        """
        max_needed_column = max(self.column_mapping.values())

        if self.worksheet.max_column > max_needed_column:
            self.worksheet.delete_cols(
                max_needed_column + 1, self.worksheet.max_column - max_needed_column
            )

    def _create_status_sheet(self):
        """
        Creates a sheet with all valid project status names from the DB.
        This will be used as the source for the status dropdown validation.
        """
        if self.STATUS_SHEET_NAME in self.workbook.sheetnames:
            self.status_worksheet = self.workbook[self.STATUS_SHEET_NAME]
        else:
            self.status_worksheet = self.workbook.create_sheet(self.STATUS_SHEET_NAME)

        statuses = ProjectStatus.objects.all().order_by("name")

        # Write the status names to the sheet (one per row, in column A)
        for idx, status in enumerate(statuses, start=1):
            self.status_worksheet.cell(row=idx, column=1, value=status.name)

    def _write_data_rows(self):
        """Write all project report data to the worksheet."""
        # The template's first data row is used as a formatting source for all other rows
        template_row = self.FIRST_DATA_ROW

        # Delete any extra template rows (if present)
        # We'll keep just the first template data row and duplicate it...
        if self.worksheet.max_row > template_row:
            self.worksheet.delete_rows(
                template_row + 1, self.worksheet.max_row - template_row
            )

        for idx, report_data in enumerate(self.project_reports_data):
            current_row = self.FIRST_DATA_ROW + idx
            if idx > 0:
                # Insert row and copy style if we're not on the first data row
                self.worksheet.insert_rows(current_row, 1)
                self._copy_row_style(template_row, current_row)

            self._write_row_data(current_row, report_data)

    def _copy_row_style(self, source_row, target_row):
        for col_idx in range(1, len(self.column_mapping) + 1):
            source_cell = self.worksheet.cell(source_row, col_idx)
            target_cell = self.worksheet.cell(target_row, col_idx)

            if source_cell.has_style:
                target_cell.font = copy(source_cell.font)
                target_cell.border = copy(source_cell.border)
                target_cell.fill = copy(source_cell.fill)
                target_cell.number_format = copy(source_cell.number_format)
                target_cell.protection = copy(source_cell.protection)
                target_cell.alignment = copy(source_cell.alignment)

    def _write_row_data(self, row_number, report_data):
        """Writes a single project report's data to the row identified by row_number"""
        for field_name, col_idx in self.column_mapping.items():
            cell = self.worksheet.cell(row_number, col_idx)
            value = self._format_field_value(field_name, report_data)
            cell.value = value

    def _format_field_value(self, field_name, report_data):
        """
        Format field value appropriately for Excel.
        Dates are converted to date objects, numbers remain as numbers.
        """
        value = report_data.get(field_name)
        if value is None:
            return None

        # Handle numeric fields
        if field_name in self.NUMERIC_FIELDS:
            if isinstance(value, (int, float, Decimal)):
                return float(value)
            return None

        # Handle boolean fields - convert to Yes/No
        if field_name in self.BOOLEAN_FIELDS or isinstance(value, bool):
            if isinstance(value, bool):
                return "Yes" if value else "No"
            # Also handle if it comes as 1/0
            if value in (1, "1", True):
                return "Yes"
            if value in (0, "0", False):
                return "No"
            return ""

        # Handle date fields - convert to date object for Excel
        if field_name in self.DATE_FIELDS:
            if isinstance(value, str):
                try:
                    # Parse ISO date string and return as date object
                    return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
                except (ValueError, AttributeError):
                    pass
            return None

        # All other fields as string
        return str(value) if value else ""

    def _apply_cell_formatting(self):
        """
        Applies proper formats to date, numeric, and boolean columns.
        """
        if not self.project_reports_data:
            return

        first_row = self.FIRST_DATA_ROW
        last_row = self.FIRST_DATA_ROW + len(self.project_reports_data) - 1

        for field_name, col_idx in self.column_mapping.items():
            if field_name in self.DATE_FIELDS:
                for row in range(first_row, last_row + 1):
                    cell = self.worksheet.cell(row, col_idx)
                    cell.number_format = self.DATE_FORMAT

            elif field_name in self.PERCENTAGE_FIELDS:
                for row in range(first_row, last_row + 1):
                    cell = self.worksheet.cell(row, col_idx)
                    cell.number_format = "0.00%"

            elif field_name in self.NUMERIC_FIELDS:
                for row in range(first_row, last_row + 1):
                    cell = self.worksheet.cell(row, col_idx)
                    # Format with thousands separator and 2 decimal places
                    cell.number_format = "#,##0.00"

            elif field_name in self.BOOLEAN_FIELDS:
                for row in range(first_row, last_row + 1):
                    cell = self.worksheet.cell(row, col_idx)
                    # Text format ensures Yes/No displays properly
                    cell.number_format = "@"

    def _apply_data_validation(self):
        """
        Apply data validation to the status column.
        Users can only select values from the Status Values sheet.
        """
        if not self.status_column_idx or not self.project_reports_data:
            return

        status_count = ProjectStatus.objects.count()
        if status_count == 0:
            return

        # Create data validation referencing the status sheet
        # Formula references the range in the Status Values sheet
        status_validation = DataValidation(
            type="list",
            formula1=f"'{self.STATUS_SHEET_NAME}'!$A$1:$A${status_count}",
            allow_blank=True,
            showErrorMessage=True,
            error="Please select a valid status from the dropdown list.",
            errorTitle="Invalid Status",
        )

        self.worksheet.add_data_validation(status_validation)

        # Apply validation to all status cells in data rows
        first_row = self.FIRST_DATA_ROW
        last_row = self.FIRST_DATA_ROW + len(self.project_reports_data) - 1
        col_letter = get_column_letter(self.status_column_idx)

        # Add the range to the validation
        status_validation.add(f"{col_letter}{first_row}:{col_letter}{last_row}")

    def _create_response(self):
        if self.agency_name:
            safe_agency_name = "".join(
                c for c in self.agency_name if c.isalnum() or c in (" ", "-", "_")
            ).strip()
            filename = f"APR_{self.year}_{safe_agency_name}.xlsx"
        else:
            # This is a multi-agency report (for MLFS to edit)
            filename = f"APR_{self.year}_All_Agencies.xlsx"

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        self.workbook.save(response)
        return response


class APRSummaryTablesExportWriter:
    """
    Generates multi-sheet Excel export with summary tables for APR.
    Unlike APRExportWriter, this includes *all* data regardless of UI filters.
    """

    TEMPLATE_PATH = (
        settings.ROOT_DIR / "api" / "export" / "templates" / "APRSummaryTables.xlsx"
    )

    SHEET_DETAIL = "Annex I APR report"
    SHEET_ANNUAL = "Annex I (a)"
    SHEET_INVESTMENT = "Annex I (b)"
    SHEET_NON_INVESTMENT = "Annex I (c)"

    # Row position constants - Detail sheet
    DETAIL_DATA_START_ROW = 3

    # Row position constants - Annual summary sheet
    ANNUAL_HEADER_ROW = 6
    ANNUAL_DATA_START_ROW = 7

    # Row position constants - Cumulative sheets (b) and (c)
    CUMULATIVE_REGION_HEADER_ROW = 7
    CUMULATIVE_REGION_DATA_ROW = 8
    CUMULATIVE_SECTOR_HEADER_ROW = 19
    CUMULATIVE_SECTOR_DATA_ROW = 20

    @classmethod
    def build_column_mapping(cls):
        """
        Generate column index-to-field mapping from serializer's excel_fields.
        This ensures consistency between serializer and Excel export.
        """
        excel_fields = AnnualProjectReportReadSerializer.Meta.excel_fields
        # Map fields to column numbers (1-indexed)
        return {field: idx + 1 for idx, field in enumerate(excel_fields)}

    @classmethod
    def build_annual_column_mapping(cls):
        """Column mapping for Annual summary sheet (a)"""
        return {
            "approval_year": 1,
            "num_approvals": 2,
            "num_completed": 3,
            "pct_completed": 4,
            "approved_funding": 5,
            "funds_disbursed": 6,
            "balance": 7,
            "sum_pct_disbursed": 8,
        }

    @classmethod
    def build_cumulative_column_mapping(cls, include_odp_co2=False):
        """Column mapping for Cumulative sheets (b) and (c)"""
        mapping = {
            "group_name": 1,
            "num_completed": 2,
            "approved_funding": 3,
            "pct_disbursed": 4,
        }

        if include_odp_co2:
            mapping.update(
                {
                    "consumption_odp": 5,
                    "production_odp": 6,
                    "consumption_co2": 7,
                    "production_co2": 8,
                    "avg_months_to_disbursement": 9,
                    "avg_months_to_completion": 10,
                    "cost_effectiveness": 11,
                }
            )
        else:
            mapping.update(
                {
                    "avg_months_to_disbursement": 5,
                    "avg_months_to_completion": 6,
                    "cost_effectiveness": 7,
                }
            )

        return mapping

    def __init__(self, year, agency=None):
        self.year = year
        self.agency = agency
        self.workbook = None
        self.column_mapping = self.build_column_mapping()
        self.annual_column_mapping = self.build_annual_column_mapping()

    def generate(self):
        self.workbook = load_workbook(self.TEMPLATE_PATH)

        queryset = AnnualProjectReport.objects.filter(
            report__progress_report__year=self.year
        ).select_related(
            "project",
            "project__agency",
            "project__country",
            "project__country__parent",
            "project__sector",
            "project__status",
            "project__project_type",
        )

        if self.agency:
            queryset = queryset.filter(project__agency=self.agency)

        # Sheet 1: Detail export (reuse existing writer logic)
        self._write_detail_sheet(queryset)

        # Sheet 2: (a) Annual summary by approval year
        self._write_annual_summary_sheet(queryset)

        # Sheet 3: (b) Completed investment projects
        self._write_investment_projects_sheet(queryset)

        # Sheet 4: (c) Completed non-investment projects
        self._write_non_investment_projects_sheet(queryset)

        return self._create_response()

    def _write_detail_sheet(self, queryset):
        project_reports_data = AnnualProjectReportReadSerializer(
            queryset, many=True
        ).data

        # Create detail sheet using existing APRExportWriter
        agency_name = self.agency.name if self.agency else None
        detail_writer = APRExportWriter(
            year=self.year,
            agency_name=agency_name,
            project_reports_data=project_reports_data,
        )
        detail_writer.workbook = self.workbook
        detail_writer.worksheet = self.workbook.create_sheet(self.SHEET_DETAIL)
        detail_writer.status_worksheet = self.workbook.create_sheet(
            detail_writer.STATUS_SHEET_NAME
        )

        # Then Generate detail content (skipping workbook creation)
        detail_writer._remove_extra_columns()
        detail_writer._create_status_sheet()
        detail_writer._write_data_rows()
        detail_writer._apply_cell_formatting()
        detail_writer._apply_data_validation()

    def _write_annual_summary_sheet(self, queryset):
        """Sheet (a): Annual summary data by approval year"""
        ws = self.workbook[self.SHEET_ANNUAL]

        # Write headers at the specified row
        headers = [
            ("A", "Approval year"),
            ("B", "Number of Approvals"),
            ("C", "Number of completed"),
            ("D", "Per cent completed (%)"),
            ("E", "Approved funding plus adjustments (US$)"),
            ("F", "Funds disbursed (US$)"),
            ("G", "Balance (US$)"),
            ("H", "Sum of % of funding disb"),
        ]

        for col_letter, value in headers:
            cell = f"{col_letter}{self.ANNUAL_HEADER_ROW}"
            ws[cell] = value
            ws[cell].font = Font(bold=True)
            ws[cell].fill = PatternFill(
                start_color="B4C7E7", end_color="B4C7E7", fill_type="solid"
            )

        # Aggregate by approval year
        aggregated = (
            queryset.annotate(approval_year=ExtractYear("project__date_approved"))
            .values("approval_year")
            .annotate(
                num_approvals=Count("id"),
                num_completed=Count("id", filter=Q(project__status__code="COM")),
                total_funds_disbursed=Sum("funds_disbursed"),
            )
            .order_by("approval_year")
        )

        # Write data rows - calculate approved funding and balance manually
        row = self.ANNUAL_DATA_START_ROW
        for item in aggregated:
            if item["approval_year"]:
                # Get projects for this year to calculate derived fields
                year_projects = queryset.filter(
                    project__date_approved__year=item["approval_year"]
                )

                # Calculate totals manually since we can't aggregate cached_properties
                total_approved_funding = 0
                total_balance = 0
                sum_pct_disbursed = 0
                count_with_pct = 0

                for apr in year_projects:
                    if apr.approved_funding_plus_adjustment:
                        total_approved_funding += apr.approved_funding_plus_adjustment
                    if apr.balance is not None:
                        total_balance += apr.balance
                    if apr.per_cent_funds_disbursed is not None:
                        sum_pct_disbursed += apr.per_cent_funds_disbursed * 100
                        count_with_pct += 1

                avg_pct_disbursed = (
                    sum_pct_disbursed / count_with_pct if count_with_pct > 0 else 0
                )

                # Use column mapping for consistency
                col_map = self.annual_column_mapping
                ws.cell(row, col_map["approval_year"], item["approval_year"])
                ws.cell(row, col_map["num_approvals"], item["num_approvals"])
                ws.cell(row, col_map["num_completed"], item["num_completed"])

                # Calculate percentage
                pct_completed = (
                    (item["num_completed"] / item["num_approvals"] * 100)
                    if item["num_approvals"]
                    else 0
                )
                ws.cell(row, col_map["pct_completed"], f"{pct_completed:.0f}%")

                ws.cell(row, col_map["approved_funding"], total_approved_funding)
                ws.cell(
                    row, col_map["funds_disbursed"], item["total_funds_disbursed"] or 0
                )
                ws.cell(row, col_map["balance"], total_balance)
                ws.cell(row, col_map["sum_pct_disbursed"], avg_pct_disbursed)

                # Format numbers
                for col_name in ["approved_funding", "funds_disbursed", "balance"]:
                    ws.cell(row, col_map[col_name]).number_format = "#,##0"
                ws.cell(row, col_map["sum_pct_disbursed"]).number_format = "0"

                row += 1

    def _write_investment_projects_sheet(self, queryset):
        """Sheet (b): Cumulative completed investment projects by region and sector"""

        ws = self.workbook[self.SHEET_INVESTMENT]

        # Filter for completed investment projects
        completed_investment = queryset.filter(
            project__status__code="COM",
            project__project_type__code="INV",
        )

        # Section 1: By Region
        self._write_aggregation_section(
            ws,
            completed_investment,
            "region",
            start_row=self.CUMULATIVE_REGION_HEADER_ROW,
            group_field="project__country__parent__name",
            include_odp_co2=True,
            write_headers=True,
        )

        # Section 2: By Sector
        self._write_aggregation_section(
            ws,
            completed_investment,
            "sector",
            start_row=self.CUMULATIVE_SECTOR_HEADER_ROW,
            group_field="project__sector__code",
            include_odp_co2=True,
            write_headers=True,
        )

    def _write_non_investment_projects_sheet(self, queryset):
        """Sheet (c): Cumulative completed non-investment projects by region and sector"""
        ws = self.workbook[self.SHEET_NON_INVESTMENT]

        # Filter for completed non-investment projects
        completed_non_investment = queryset.filter(project__status__code="COM").exclude(
            project__project_type__code="INV"
        )

        # Section 1: By Region
        self._write_aggregation_section(
            ws,
            completed_non_investment,
            "region",
            start_row=self.CUMULATIVE_REGION_HEADER_ROW,
            group_field="project__country__parent__name",
            include_odp_co2=False,
            write_headers=True,
        )

        # Section 2: By Sector
        self._write_aggregation_section(
            ws,
            completed_non_investment,
            "sector",
            start_row=self.CUMULATIVE_SECTOR_HEADER_ROW,
            group_field="project__sector__code",
            include_odp_co2=False,
            write_headers=True,
        )

    def _write_aggregation_section(
        self,
        ws,
        queryset,
        dimension,
        start_row,
        group_field,
        include_odp_co2,
        write_headers=False,
    ):
        """Write one aggregation section (region or sector) with headers and data"""
        # Write section headers (only if not using template)
        if write_headers:
            header_row = start_row
            ws.cell(header_row, 1, dimension.capitalize()).font = Font(
                bold=True, italic=True
            )
            ws.cell(header_row, 1).fill = PatternFill(
                start_color="D9E1F2", end_color="D9E1F2", fill_type="solid"
            )

            col = 2
            base_headers = [
                "Number of completed",
                "Approved funding plus adjustments (US$)",
                "Per cent of funds disbursed (%)",
            ]

            if include_odp_co2:
                base_headers.extend(
                    [
                        "Consumption Phased Out (ODP/MT)",
                        "Production Phased Out (ODP/MT)",
                        "Consumption Phased Out (CO2-eq)",
                        "Production Phased Out (CO2-eq)",
                    ]
                )

            base_headers.extend(
                [
                    "Average number of months from approval to first disbursement",
                    "Average number of months from approval to completion",
                    "Cost effectiveness to fund (US$/kg.)",
                ]
            )

            for header in base_headers:
                ws.cell(header_row, col, header).font = Font(bold=True)
                ws.cell(header_row, col).fill = PatternFill(
                    start_color="8EA9DB", end_color="8EA9DB", fill_type="solid"
                )
                col += 1

            # Data starts one row after headers
            data_start_row = start_row + 1
        else:
            # Template has headers, start data immediately at start_row
            data_start_row = start_row

        # Aggregate data
        annotations = {"num_completed": Count("id")}

        if include_odp_co2:
            annotations.update(
                {
                    "total_consumption_odp": Sum("consumption_phased_out_odp"),
                    "total_production_odp": Sum("production_phased_out_odp"),
                    "total_consumption_co2": Sum("consumption_phased_out_co2"),
                    "total_production_co2": Sum("production_phased_out_co2"),
                }
            )

        aggregated = (
            queryset.values(group_field).annotate(**annotations).order_by(group_field)
        )

        # Calculate date-based averages, funding, and avg_pct_disbursed manually
        data_with_averages = []
        for item in aggregated:
            # Get projects for this group to calculate derived fields
            group_projects = queryset.filter(**{group_field: item[group_field]})

            # Calculate total approved funding manually
            total_approved_funding = sum(
                apr.approved_funding_plus_adjustment or 0 for apr in group_projects
            )

            # Calculate average percent disbursed manually
            pct_values = [
                apr.per_cent_funds_disbursed * 100
                for apr in group_projects
                if apr.per_cent_funds_disbursed is not None
            ]
            avg_pct_disbursed = sum(pct_values) / len(pct_values) if pct_values else 0

            avg_months_to_disbursement = self._calculate_avg_months(
                group_projects, "project__date_approved", "date_first_disbursement"
            )
            avg_months_to_completion = self._calculate_avg_months(
                group_projects, "project__date_approved", "date_actual_completion"
            )

            # Cost effectiveness (funding / consumption ODP in kg)
            cost_effectiveness = None
            if include_odp_co2 and item["total_consumption_odp"]:
                cost_effectiveness = total_approved_funding / (
                    item["total_consumption_odp"] * 1000
                )

            data_with_averages.append(
                {
                    **item,
                    "total_approved_funding": total_approved_funding,
                    "avg_pct_disbursed": avg_pct_disbursed,
                    "avg_months_to_disbursement": avg_months_to_disbursement,
                    "avg_months_to_completion": avg_months_to_completion,
                    "cost_effectiveness": cost_effectiveness,
                }
            )

        # Write data rows
        row = data_start_row
        for item in data_with_averages:
            group_name = item[group_field] or "Unknown"
            ws.cell(row, 1, group_name)

            col = 2
            ws.cell(row, col, item["num_completed"])
            col += 1

            ws.cell(row, col, item["total_approved_funding"] or 0)
            ws.cell(row, col).number_format = "#,##0"
            col += 1

            ws.cell(row, col, item["avg_pct_disbursed"] or 0)
            ws.cell(row, col).number_format = "0"
            col += 1

            if include_odp_co2:
                for odp_co2_val in [
                    item["total_consumption_odp"],
                    item["total_production_odp"],
                    item["total_consumption_co2"],
                    item["total_production_co2"],
                ]:
                    ws.cell(row, col, odp_co2_val or 0)
                    ws.cell(row, col).number_format = "#,##0"
                    col += 1

            ws.cell(row, col, item["avg_months_to_disbursement"])
            ws.cell(row, col).number_format = "0"
            col += 1

            ws.cell(row, col, item["avg_months_to_completion"])
            ws.cell(row, col).number_format = "0"
            col += 1

            ws.cell(row, col, item["cost_effectiveness"])
            ws.cell(row, col).number_format = "0.00"
            col += 1

            row += 1

        # Write Grand Total row (ungrouped aggregation)
        self._write_grand_total_row(ws, queryset, row, include_odp_co2)

    def _calculate_avg_months(self, queryset, start_date_field, end_date_field):
        """Calculate average months between two date fields"""
        projects = (
            queryset.select_related("project")
            .exclude(**{f"{start_date_field}__isnull": True})
            .exclude(**{f"{end_date_field}__isnull": True})
        )

        total_months = 0
        count = 0

        for apr in projects:
            # Navigate to get the actual date values
            start_date = apr
            end_date = apr

            for field in start_date_field.split("__"):
                start_date = getattr(start_date, field, None)
                if start_date is None:
                    break

            for field in end_date_field.split("__"):
                end_date = getattr(end_date, field, None)
                if end_date is None:
                    break

            if start_date and end_date:
                delta = relativedelta(end_date, start_date)
                months = delta.years * 12 + delta.months
                total_months += months
                count += 1

        return total_months / count if count > 0 else 0

    def _write_grand_total_row(self, ws, queryset, row, include_odp_co2):
        """Write Grand Total row with ungrouped aggregation"""
        # Calculate totals across all groups
        annotations = {"num_completed": Count("id")}

        if include_odp_co2:
            annotations.update(
                {
                    "total_consumption_odp": Sum("consumption_phased_out_odp"),
                    "total_production_odp": Sum("production_phased_out_odp"),
                    "total_consumption_co2": Sum("consumption_phased_out_co2"),
                    "total_production_co2": Sum("production_phased_out_co2"),
                }
            )

        totals = queryset.aggregate(**annotations)

        # Calculate total approved funding manually
        total_approved_funding = sum(
            apr.approved_funding_plus_adjustment or 0 for apr in queryset
        )

        # Calculate average percent disbursed manually
        pct_values = [
            apr.per_cent_funds_disbursed * 100
            for apr in queryset
            if apr.per_cent_funds_disbursed is not None
        ]
        avg_pct_disbursed = sum(pct_values) / len(pct_values) if pct_values else 0

        avg_months_to_disbursement = self._calculate_avg_months(
            queryset, "project__date_approved", "date_first_disbursement"
        )
        avg_months_to_completion = self._calculate_avg_months(
            queryset, "project__date_approved", "date_actual_completion"
        )

        cost_effectiveness = None
        if include_odp_co2 and totals["total_consumption_odp"]:
            cost_effectiveness = total_approved_funding / (
                totals["total_consumption_odp"] * 1000
            )

        # Write Grand Total row
        ws.cell(row, 1, "Grand Total").font = Font(bold=True)

        col = 2
        ws.cell(row, col, totals["num_completed"])
        col += 1

        ws.cell(row, col, total_approved_funding)
        ws.cell(row, col).number_format = "#,##0"
        col += 1

        ws.cell(row, col, avg_pct_disbursed or 0)
        ws.cell(row, col).number_format = "0"
        col += 1

        if include_odp_co2:
            for odp_co2_val in [
                totals["total_consumption_odp"],
                totals["total_production_odp"],
                totals["total_consumption_co2"],
                totals["total_production_co2"],
            ]:
                ws.cell(row, col, odp_co2_val or 0)
                ws.cell(row, col).number_format = "#,##0"
                col += 1

        ws.cell(row, col, avg_months_to_disbursement)
        ws.cell(row, col).number_format = "0"
        col += 1

        ws.cell(row, col, avg_months_to_completion)
        ws.cell(row, col).number_format = "0"
        col += 1

        ws.cell(row, col, cost_effectiveness)
        ws.cell(row, col).number_format = "0.00"

    def _create_response(self):
        output = BytesIO()
        self.workbook.save(output)
        output.seek(0)

        filename = f"APR_Summary_Tables_{self.year}"
        if self.agency:
            filename += f"_{self.agency.name.replace(' ', '_')}"
        filename += ".xlsx"

        response = HttpResponse(
            output.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
