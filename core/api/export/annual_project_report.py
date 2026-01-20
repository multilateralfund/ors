from copy import copy
from collections import defaultdict
from datetime import datetime
from dateutil.relativedelta import relativedelta
from decimal import Decimal
from io import BytesIO

from django.conf import settings
from django.db.models import Count, Sum, Q
from django.http import HttpResponse
from openpyxl import load_workbook
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

from core.api.serializers.annual_project_report import AnnualProjectReportReadSerializer
from core.models import AnnualProjectReport, ProjectStatus

# pylint: disable=R0902,R0911,R0913,R0914,R0915,R1705,W0212,C0302


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

    def __init__(self, year=None, agency_name=None, project_reports_data=None):
        """
        If agency_name is None, the report includes all agencies.
        If year is None, it's a cumulative report for all years.
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
            if self.year:
                filename = f"APR_{self.year}_{safe_agency_name}.xlsx"
            else:
                filename = "APR_Cumulative_{safe_agency_name}.xlsx"
        else:
            # This is a multi-agency report (for MLFS to edit)
            if self.year:
                filename = f"APR_{self.year}_All_Agencies.xlsx"
            else:
                filename = "APR_Cumulative_All_Agencies.xlsx"

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

    SHEET_DETAIL = "Annex I APR Report"
    SHEET_ANNUAL = "Annex I (a)"
    SHEET_INVESTMENT = "Annex I (b)"
    SHEET_NON_INVESTMENT = "Annex I (c)"
    SHEET_PREPARATION = "Annex I (d)"
    SHEET_ONGOING_INVESTMENT = "Annex I (e)"
    SHEET_ONGOING_NON_INVESTMENT = "Annex I (f)"
    SHEET_ONGOING_PREPARATION = "Annex I (g)"

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

    # Row position constants - Sheet (d) Preparation projects
    PREPARATION_REGION_HEADER_ROW = 7
    PREPARATION_REGION_DATA_ROW = 8
    PREPARATION_SECTOR_HEADER_ROW = 19
    PREPARATION_SECTOR_DATA_ROW = 20

    # Row position constants - Sheet (e) Ongoing investment projects
    ONGOING_REGION_HEADER_ROW = 7
    ONGOING_REGION_DATA_ROW = 8
    ONGOING_SECTOR_HEADER_ROW = 19
    ONGOING_SECTOR_DATA_ROW = 20

    # Row position constants - Sheet (f) Ongoing non-investment projects
    ONGOING_NON_INV_REGION_HEADER_ROW = 7
    ONGOING_NON_INV_REGION_DATA_ROW = 8
    ONGOING_NON_INV_SECTOR_HEADER_ROW = 19
    ONGOING_NON_INV_SECTOR_DATA_ROW = 20

    # Row position constants - Sheet (g) Ongoing preparation projects
    ONGOING_PREP_REGION_HEADER_ROW = 7
    ONGOING_PREP_REGION_DATA_ROW = 8
    ONGOING_PREP_SECTOR_HEADER_ROW = 19
    ONGOING_PREP_SECTOR_DATA_ROW = 20

    @classmethod
    def build_column_mapping(cls):
        """
        Generate column index-to-field mapping from serializer's excel_fields.
        This ensures consistency between serializer and Excel export.
        """
        excel_fields = AnnualProjectReportReadSerializer.Meta.excel_fields
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

    @classmethod
    def build_preparation_column_mapping(cls):
        """Column mapping for Sheet (d) - Preparation projects"""
        return {
            "group_name": 1,
            "num_completed": 2,
            "approved_funding": 3,
            "pct_disbursed": 4,
            "avg_months_to_disbursement": 5,
            "avg_months_to_completion": 6,
        }

    @classmethod
    def build_ongoing_investment_column_mapping(cls):
        """Column mapping for Sheet (e) - Ongoing investment projects"""
        return {
            "group_name": 1,
            "num_projects": 2,
            "approved_funding": 3,
            "funds_disbursed": 4,
            "pct_disbursed": 5,
            "num_disbursing": 6,
            "pct_disbursing": 7,
            "avg_months_to_disbursement": 8,
            "avg_months_to_completion": 9,
            "avg_delay": 10,
            "cost_effectiveness": 11,
        }

    @classmethod
    def build_ongoing_non_investment_column_mapping(cls):
        """Column mapping for Sheet (f) - Ongoing non-investment projects"""
        return {
            "group_name": 1,
            "num_projects": 2,
            "approved_funding": 3,
            "funds_disbursed": 4,
            "pct_disbursed": 5,
            "num_disbursing": 6,
            "pct_disbursing": 7,
            "avg_months_to_disbursement": 8,
            "avg_months_to_completion": 9,
            "avg_delay": 10,
        }

    @classmethod
    def build_ongoing_preparation_column_mapping(cls):
        """Column mapping for Sheet (g) - Ongoing preparation projects"""
        return {
            "group_name": 1,
            "num_projects": 2,
            "approved_funding": 3,
            "funds_disbursed": 4,
            "pct_disbursed": 5,
            "avg_months_to_disbursement": 6,
            "avg_months_to_completion": 7,
            "avg_delay": 8,
        }

    def __init__(self, agency=None):
        self.agency = agency
        self.workbook = None
        self.column_mapping = self.build_column_mapping()
        self.annual_column_mapping = self.build_annual_column_mapping()

        # Get all APR data
        queryset = AnnualProjectReport.objects.all().select_related(
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
        self.queryset = queryset

        self.serialized_data = AnnualProjectReportReadSerializer(
            self.queryset, many=True
        ).data

    def generate(self):
        self.workbook = load_workbook(self.TEMPLATE_PATH)

        # Sheet 1: Detail export (reuse existing writer logic)
        self._write_detail_sheet()

        # Sheet 2: (a) Annual summary by approval year
        self._write_annual_summary_sheet()

        # Sheet 3: (b) Completed investment projects
        self._write_investment_projects_sheet()

        # Sheet 4: (c) Completed non-investment projects
        self._write_non_investment_projects_sheet()

        # Sheet 5: (d) Completed preparation projects
        self._write_preparation_activities_sheet()

        # Sheet 6: (e) Ongoing/Completed investment projects
        self._write_ongoing_investment_sheet()

        # Sheet 7: (f) Ongoing/Completed non-investment projects
        self._write_ongoing_non_investment_sheet()

        # Sheet 8: (g) Ongoing/Completed preparation projects
        self._write_ongoing_preparation_sheet()

        return self._create_response()

    def _write_detail_sheet(self):
        """Generate the detail sheet using existing APRExportWriter logic"""
        # Use the existing detail sheet from template
        if self.SHEET_DETAIL not in self.workbook.sheetnames:
            # Fallback: create it if somehow missing
            detail_worksheet = self.workbook.create_sheet(self.SHEET_DETAIL)
        else:
            detail_worksheet = self.workbook[self.SHEET_DETAIL]

        # Clear any template data from the detail sheet (keep headers at row 2, clear from row 3)
        self._clear_template_data_rows(detail_worksheet, 3)

        # Create detail sheet using existing APRExportWriter
        agency_name = self.agency.name if self.agency else None
        detail_writer = APRExportWriter(
            year=None,
            agency_name=agency_name,
            project_reports_data=self.serialized_data,
        )
        detail_writer.workbook = self.workbook
        detail_writer.worksheet = detail_worksheet

        # Create a temporary status sheet for validation
        detail_writer.status_worksheet = self.workbook.create_sheet(
            detail_writer.STATUS_SHEET_NAME
        )

        # Generate detail content (skipping workbook creation and extra column removal)
        # Don't call _remove_extra_columns since template already has correct structure
        detail_writer._create_status_sheet()
        detail_writer._write_data_rows()
        detail_writer._apply_cell_formatting()
        detail_writer._apply_data_validation()

        # Remove the Status Values sheet as it's not needed in summary export
        if detail_writer.STATUS_SHEET_NAME in self.workbook.sheetnames:
            del self.workbook[detail_writer.STATUS_SHEET_NAME]

    def _clear_template_data_rows(self, ws, start_row, end_row=None):
        """
        Clear any template/sample data from the worksheet by setting cell values to None.
        Does *not* delete rows as it would shift row numbers; just clears the contents;
        it keeps headers intact
        """
        if end_row is None:
            end_row = ws.max_row

        for row in range(start_row, end_row + 1):
            for col in range(1, ws.max_column + 1):
                ws.cell(row, col).value = None

    def _write_annual_summary_sheet(self):
        """Sheet (a): Annual summary data by approval year"""
        ws = self.workbook[self.SHEET_ANNUAL]

        self._clear_template_data_rows(ws, self.ANNUAL_DATA_START_ROW)

        # Group serialized data by approval year
        year_data = defaultdict(list)
        for item in self.serialized_data:
            date_approved = item.get("date_approved")
            if date_approved:
                # Parse date and extract year
                if isinstance(date_approved, str):
                    try:
                        year = datetime.fromisoformat(
                            date_approved.replace("Z", "+00:00")
                        ).year
                    except (ValueError, AttributeError):
                        continue
                else:
                    continue
                year_data[year].append(item)

        # Process each year
        row = self.ANNUAL_DATA_START_ROW
        for approval_year in sorted(year_data.keys()):
            year_projects = year_data[approval_year]

            num_approvals = len(year_projects)
            num_completed = sum(1 for p in year_projects if p.get("status") == "COM")

            # Calculate totals from serialized data
            total_approved_funding = sum(
                p.get("approved_funding_plus_adjustment") or 0 for p in year_projects
            )
            total_balance = sum(p.get("balance") or 0 for p in year_projects)
            total_funds_disbursed = sum(
                p.get("funds_disbursed") or 0 for p in year_projects
            )

            pct_values = [
                p.get("per_cent_funds_disbursed") * 100
                for p in year_projects
                if p.get("per_cent_funds_disbursed") is not None
            ]
            avg_pct_disbursed = sum(pct_values) / len(pct_values) if pct_values else 0

            col_map = self.annual_column_mapping
            ws.cell(row, col_map["approval_year"], approval_year)
            ws.cell(row, col_map["num_approvals"], num_approvals)
            ws.cell(row, col_map["num_completed"], num_completed)

            # Calculate percentages
            pct_completed = (
                (num_completed / num_approvals * 100) if num_approvals else 0
            )
            ws.cell(row, col_map["pct_completed"], f"{pct_completed:.0f}%")

            ws.cell(row, col_map["approved_funding"], total_approved_funding)
            ws.cell(row, col_map["funds_disbursed"], total_funds_disbursed)
            ws.cell(row, col_map["balance"], total_balance)
            ws.cell(row, col_map["sum_pct_disbursed"], avg_pct_disbursed)

            # Format numbers
            for col_name in ["approved_funding", "funds_disbursed", "balance"]:
                ws.cell(row, col_map[col_name]).number_format = "#,##0"
            ws.cell(row, col_map["sum_pct_disbursed"]).number_format = "0"

            row += 1

    def _write_investment_projects_sheet(self):
        """Sheet (b): Cumulative completed investment projects by region and sector"""

        ws = self.workbook[self.SHEET_INVESTMENT]

        # Clear template data for region & sector section (rows 8-18 and then 20+)
        self._clear_template_data_rows(
            ws, self.CUMULATIVE_REGION_DATA_ROW, self.CUMULATIVE_SECTOR_HEADER_ROW - 1
        )
        self._clear_template_data_rows(ws, self.CUMULATIVE_SECTOR_DATA_ROW)

        completed_investment = self.queryset.filter(
            project__status__code="COM",
            project__project_type__code="INV",
        )

        # Section 1: by Region
        self._write_aggregation_section(
            ws,
            completed_investment,
            start_row=self.CUMULATIVE_REGION_HEADER_ROW,
            group_field="project__country__parent__name",
            include_odp_co2=True,
        )

        # Section 2: by Sector
        self._write_aggregation_section(
            ws,
            completed_investment,
            start_row=self.CUMULATIVE_SECTOR_HEADER_ROW,
            group_field="project__sector__code",
            include_odp_co2=True,
        )

    def _write_non_investment_projects_sheet(self):
        """Sheet (c): Cumulative completed non-investment projects by region and sector"""
        ws = self.workbook[self.SHEET_NON_INVESTMENT]

        # Clear template data for region & sector sections
        self._clear_template_data_rows(
            ws, self.CUMULATIVE_REGION_DATA_ROW, self.CUMULATIVE_SECTOR_HEADER_ROW - 1
        )
        self._clear_template_data_rows(ws, self.CUMULATIVE_SECTOR_DATA_ROW)

        completed_non_investment = self.queryset.filter(
            project__status__code="COM"
        ).exclude(project__project_type__code="INV")

        # Section 1: by Region
        self._write_aggregation_section(
            ws,
            completed_non_investment,
            start_row=self.CUMULATIVE_REGION_HEADER_ROW,
            group_field="project__country__parent__name",
            include_odp_co2=False,
        )

        # Section 2: by Sector
        self._write_aggregation_section(
            ws,
            completed_non_investment,
            start_row=self.CUMULATIVE_SECTOR_HEADER_ROW,
            group_field="project__sector__code",
            include_odp_co2=False,
        )

    def _write_preparation_activities_sheet(self):
        """Sheet (d): Cumulative completed project preparation activities by region and sector"""
        ws = self.workbook[self.SHEET_PREPARATION]

        self._clear_template_data_rows(
            ws, self.PREPARATION_REGION_DATA_ROW, self.PREPARATION_SECTOR_HEADER_ROW - 1
        )
        self._clear_template_data_rows(ws, self.PREPARATION_SECTOR_DATA_ROW)

        completed_preparation = self.queryset.filter(
            project__status__code="COM",
            project__project_type__code="PRP",
        )

        # Section 1: by Region
        self._write_aggregation_section(
            ws,
            completed_preparation,
            start_row=self.PREPARATION_REGION_HEADER_ROW,
            group_field="project__country__parent__name",
            include_odp_co2=False,
        )

        # Section 2: by Sector
        self._write_aggregation_section(
            ws,
            completed_preparation,
            start_row=self.PREPARATION_SECTOR_HEADER_ROW,
            group_field="project__sector__code",
            include_odp_co2=False,
        )

    def _write_ongoing_investment_sheet(self):
        """Sheet (e): Cumulative ongoing investment projects by region and sector"""
        ws = self.workbook[self.SHEET_ONGOING_INVESTMENT]

        self._clear_template_data_rows(
            ws, self.ONGOING_REGION_DATA_ROW, self.ONGOING_SECTOR_HEADER_ROW - 1
        )
        self._clear_template_data_rows(ws, self.ONGOING_SECTOR_DATA_ROW)

        ongoing_investment = self.queryset.filter(
            Q(project__status__code="COM") | Q(project__status__code="ONG"),
            project__project_type__code="INV",
        )

        # Section 1: by Region
        self._write_aggregation_section(
            ws,
            ongoing_investment,
            start_row=self.ONGOING_REGION_HEADER_ROW,
            group_field="project__country__parent__name",
            include_odp_co2=True,
            sheet_type="ongoing_investment",
        )

        # Section 2: by Sector
        self._write_aggregation_section(
            ws,
            ongoing_investment,
            start_row=self.ONGOING_SECTOR_HEADER_ROW,
            group_field="project__sector__code",
            include_odp_co2=True,
            sheet_type="ongoing_investment",
        )

    def _write_ongoing_non_investment_sheet(self):
        """Sheet (f): Cumulative ongoing non-investment projects by region and sector"""
        ws = self.workbook[self.SHEET_ONGOING_NON_INVESTMENT]

        self._clear_template_data_rows(
            ws,
            self.ONGOING_NON_INV_REGION_DATA_ROW,
            self.ONGOING_NON_INV_SECTOR_HEADER_ROW - 1,
        )
        self._clear_template_data_rows(ws, self.ONGOING_NON_INV_SECTOR_DATA_ROW)

        ongoing_non_investment = self.queryset.filter(
            Q(project__status__code="COM") | Q(project__status__code="ONG")
        ).exclude(project__project_type__code="INV")

        # Section 1: by Region
        self._write_aggregation_section(
            ws,
            ongoing_non_investment,
            start_row=self.ONGOING_NON_INV_REGION_HEADER_ROW,
            group_field="project__country__parent__name",
            include_odp_co2=False,
            sheet_type="ongoing_non_investment",
        )

        # Section 2: by Sector
        self._write_aggregation_section(
            ws,
            ongoing_non_investment,
            start_row=self.ONGOING_NON_INV_SECTOR_HEADER_ROW,
            group_field="project__sector__code",
            include_odp_co2=False,
            sheet_type="ongoing_non_investment",
        )

    def _write_ongoing_preparation_sheet(self):
        """Sheet (g): Cumulative ongoing preparation projects by region and sector"""
        ws = self.workbook[self.SHEET_ONGOING_PREPARATION]

        self._clear_template_data_rows(
            ws,
            self.ONGOING_PREP_REGION_DATA_ROW,
            self.ONGOING_PREP_SECTOR_HEADER_ROW - 1,
        )
        self._clear_template_data_rows(ws, self.ONGOING_PREP_SECTOR_DATA_ROW)

        ongoing_preparation = self.queryset.filter(
            Q(project__status__code="COM") | Q(project__status__code="ONG"),
            project__project_type__code="PRP",
        )

        # Section 1: by Region
        self._write_aggregation_section(
            ws,
            ongoing_preparation,
            start_row=self.ONGOING_PREP_REGION_HEADER_ROW,
            group_field="project__country__parent__name",
            include_odp_co2=False,
            sheet_type="ongoing_preparation",
        )

        # Section 2: by Sector
        self._write_aggregation_section(
            ws,
            ongoing_preparation,
            start_row=self.ONGOING_PREP_SECTOR_HEADER_ROW,
            group_field="project__sector__code",
            include_odp_co2=False,
            sheet_type="ongoing_preparation",
        )

    def _get_column_specs(self, sheet_type, include_odp_co2):
        if sheet_type == "ongoing_investment":
            return [
                ("num_projects", None),
                ("total_approved_funding", "#,##0"),
                ("total_funds_disbursed", "#,##0"),
                ("avg_pct_disbursed", "0"),
                ("num_disbursing", None),
                ("pct_disbursing", "0"),
                ("avg_months_to_disbursement", "0"),
                ("avg_months_to_completion", "0"),
                ("avg_delay", "0"),
                ("cost_effectiveness", "0.00"),
            ]
        elif sheet_type == "ongoing_non_investment":
            return [
                ("num_projects", None),
                ("total_approved_funding", "#,##0"),
                ("total_funds_disbursed", "#,##0"),
                ("avg_pct_disbursed", "0"),
                ("num_disbursing", None),
                ("pct_disbursing", "0"),
                ("avg_months_to_disbursement", "0"),
                ("avg_months_to_completion", "0"),
                ("avg_delay", "0"),
            ]
        elif sheet_type == "ongoing_preparation":
            return [
                ("num_projects", None),
                ("total_approved_funding", "#,##0"),
                ("total_funds_disbursed", "#,##0"),
                ("avg_pct_disbursed", "0"),
                ("avg_months_to_disbursement", "0"),
                ("avg_months_to_completion", "0"),
                ("avg_delay", "0"),
            ]
        else:
            specs = [
                ("num_completed", None),
                ("total_approved_funding", "#,##0"),
                ("avg_pct_disbursed", "0"),
            ]
            if include_odp_co2:
                specs.extend(
                    [
                        ("total_consumption_odp", None),
                        ("total_production_odp", None),
                        ("total_consumption_co2", None),
                        ("total_production_co2", None),
                    ]
                )
            specs.extend(
                [
                    ("avg_months_to_disbursement", "0"),
                    ("avg_months_to_completion", "0"),
                    ("cost_effectiveness", "0.00"),
                ]
            )
            return specs

    def _write_aggregation_section(
        self,
        ws,
        queryset,
        start_row,
        group_field,
        include_odp_co2,
        sheet_type="cumulative",
    ):
        """
        Write one aggregation section's data (region or sector) to the template
        """
        # Template has headers at start_row
        data_start_row = start_row + 1

        # Aggregating the data for the "Grand Total" row
        if sheet_type in [
            "ongoing_investment",
            "ongoing_non_investment",
            "ongoing_preparation",
        ]:
            # Sheets (e), (f), (g) count all projects, not just completed
            annotations = {"num_projects": Count("id")}
        else:
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

            total_approved_funding = sum(
                apr.approved_funding_plus_adjustment or 0 for apr in group_projects
            )
            total_funds_disbursed = sum(
                apr.funds_disbursed or 0 for apr in group_projects
            )
            pct_values = [
                apr.per_cent_funds_disbursed * 100
                for apr in group_projects
                if apr.per_cent_funds_disbursed is not None
            ]
            avg_pct_disbursed = sum(pct_values) / len(pct_values) if pct_values else 0

            avg_months_to_disbursement = self._calculate_avg_months(
                group_projects, "project__date_approved", "date_first_disbursement"
            )

            # For ongoing projects (sheets e, f, g), use date_planned_completion instead of date_actual_completion
            if sheet_type in [
                "ongoing_investment",
                "ongoing_non_investment",
                "ongoing_preparation",
            ]:
                avg_months_to_completion = self._calculate_avg_months(
                    group_projects, "project__date_approved", "date_planned_completion"
                )
                # Calculate average delay (planned completion - approval)
                avg_delay = self._calculate_avg_months(
                    group_projects, "project__date_approved", "date_planned_completion"
                )
                # Calculate disbursing metrics
                num_disbursing = sum(
                    1
                    for apr in group_projects
                    if apr.funds_disbursed and apr.funds_disbursed > 0
                )
                total_projects = group_projects.count()
                pct_disbursing = (
                    (num_disbursing / total_projects * 100) if total_projects > 0 else 0
                )
            else:
                avg_months_to_completion = self._calculate_avg_months(
                    group_projects, "project__date_approved", "date_actual_completion"
                )
                avg_delay = None
                num_disbursing = None
                pct_disbursing = None

            # Cost effectiveness (funding / consumption ODP in kg)
            cost_effectiveness = None
            if include_odp_co2 and item.get("total_consumption_odp"):
                # total_consumption_odp is in MT, converting to kg
                cost_effectiveness = total_approved_funding / (
                    item["total_consumption_odp"] * 1000
                )

            result_item = {
                **item,
                "total_approved_funding": total_approved_funding,
                "total_funds_disbursed": total_funds_disbursed,
                "avg_pct_disbursed": avg_pct_disbursed,
                "avg_months_to_disbursement": avg_months_to_disbursement,
                "avg_months_to_completion": avg_months_to_completion,
                "cost_effectiveness": cost_effectiveness,
            }

            if sheet_type in [
                "ongoing_investment",
                "ongoing_non_investment",
                "ongoing_preparation",
            ]:
                result_item.update(
                    {
                        "num_disbursing": num_disbursing,
                        "pct_disbursing": pct_disbursing,
                        "avg_delay": avg_delay,
                    }
                )

            data_with_averages.append(result_item)

        # Write data rows
        column_specs = self._get_column_specs(sheet_type, include_odp_co2)
        row = data_start_row
        for item in data_with_averages:
            group_name = item[group_field] or "Unknown"
            ws.cell(row, 1, group_name)

            col = 2
            for field_name, number_format in column_specs:
                cell = ws.cell(row, col, item.get(field_name) or 0)
                if number_format:
                    cell.number_format = number_format
                col += 1

            row += 1

        self._write_grand_total_row(ws, queryset, row, include_odp_co2, sheet_type)

    def _calculate_avg_months(self, queryset, start_date_field, end_date_field):
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

    def _write_grand_total_row(
        self, ws, queryset, row, include_odp_co2, sheet_type="cumulative"
    ):
        ws.cell(row, 1, "Grand Total").font = Font(bold=True)

        total_count = queryset.count()
        total_approved_funding = sum(
            apr.approved_funding_plus_adjustment or 0 for apr in queryset
        )
        total_funds_disbursed = sum(apr.funds_disbursed or 0 for apr in queryset)

        pct_values = [
            apr.per_cent_funds_disbursed * 100
            for apr in queryset
            if apr.per_cent_funds_disbursed is not None
        ]
        avg_pct_disbursed = sum(pct_values) / len(pct_values) if pct_values else 0

        avg_months_to_disbursement = self._calculate_avg_months(
            queryset, "project__date_approved", "date_first_disbursement"
        )

        num_disbursing = 0
        pct_disbursing = 0
        avg_delay = 0

        if sheet_type in [
            "ongoing_investment",
            "ongoing_non_investment",
            "ongoing_preparation",
        ]:
            avg_months_to_completion = self._calculate_avg_months(
                queryset, "project__date_approved", "date_planned_completion"
            )
            avg_delay = self._calculate_avg_months(
                queryset, "project__date_approved", "date_planned_completion"
            )
            num_disbursing = sum(
                1 for apr in queryset if apr.funds_disbursed and apr.funds_disbursed > 0
            )
            pct_disbursing = (
                (num_disbursing / total_count * 100) if total_count > 0 else 0
            )
        else:
            avg_months_to_completion = self._calculate_avg_months(
                queryset, "project__date_approved", "date_actual_completion"
            )

        total_consumption_odp = 0
        total_production_odp = 0
        total_consumption_co2 = 0
        total_production_co2 = 0
        cost_effectiveness = 0

        if include_odp_co2:
            total_consumption_odp = sum(
                apr.consumption_phased_out_odp or 0 for apr in queryset
            )
            total_production_odp = sum(
                apr.production_phased_out_odp or 0 for apr in queryset
            )
            total_consumption_co2 = sum(
                apr.consumption_phased_out_co2 or 0 for apr in queryset
            )
            total_production_co2 = sum(
                apr.production_phased_out_co2 or 0 for apr in queryset
            )
            cost_effectiveness = (
                total_approved_funding / (total_consumption_odp * 1000)
                if total_consumption_odp
                else 0
            )

        grand_total_data = {
            "num_projects": total_count,
            "num_completed": total_count,
            "total_approved_funding": total_approved_funding,
            "total_funds_disbursed": total_funds_disbursed,
            "avg_pct_disbursed": avg_pct_disbursed,
            "num_disbursing": num_disbursing,
            "pct_disbursing": pct_disbursing,
            "avg_months_to_disbursement": avg_months_to_disbursement,
            "avg_months_to_completion": avg_months_to_completion,
            "avg_delay": avg_delay,
            "total_consumption_odp": total_consumption_odp,
            "total_production_odp": total_production_odp,
            "total_consumption_co2": total_consumption_co2,
            "total_production_co2": total_production_co2,
            "cost_effectiveness": cost_effectiveness,
        }

        column_specs = self._get_column_specs(sheet_type, include_odp_co2)
        col = 2
        for field_name, number_format in column_specs:
            cell = ws.cell(row, col, grand_total_data.get(field_name) or 0)
            if number_format:
                cell.number_format = number_format
            col += 1

    def _create_response(self):
        """Create HTTP response with the workbook"""
        output = BytesIO()
        self.workbook.save(output)
        output.seek(0)

        filename = "APR_Summary_Tables_Cumulative"
        if self.agency:
            filename += f"_{self.agency.name.replace(' ', '_')}"
        filename += ".xlsx"

        response = HttpResponse(
            output.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
