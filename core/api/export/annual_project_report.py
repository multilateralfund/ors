from copy import copy
from datetime import datetime
from decimal import Decimal

from django.conf import settings
from django.http import HttpResponse
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

from core.api.serializers.annual_project_report import AnnualProjectReportReadSerializer
from core.models import ProjectStatus

# pylint: disable=R0902,R0911


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
