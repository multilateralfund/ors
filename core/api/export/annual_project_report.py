from copy import copy
from datetime import datetime
from decimal import Decimal

from django.conf import settings
from django.http import HttpResponse
from openpyxl import load_workbook

from core.api.serializers.annual_project_report import AnnualProjectReportReadSerializer


class APRExportWriter:
    """
    Generates Excel export for APR using Annex I template.
    """

    TEMPLATE_PATH = (
        settings.ROOT_DIR / "api" / "export" / "templates" / "APRAnnexI.xlsx"
    )
    SHEET_NAME = "Annex I APR report "
    HEADER_ROW = 1
    FIRST_DATA_ROW = 2

    @classmethod
    def build_column_mapping(cls):
        """
        Generate column index-to-field mapping from serializer's excel_fields.
        This ensures consistency between serializer and Excel export.
        """
        excel_fields = AnnualProjectReportReadSerializer.Meta.excel_fields
        # Map fields to columns (1-indexed)
        return {field: idx + 1 for idx, field in enumerate(excel_fields)}

    def __init__(self, year, agency_name, project_reports_data):
        self.year = year
        self.agency_name = agency_name
        self.project_reports_data = project_reports_data
        self.workbook = None
        self.worksheet = None
        self.column_mapping = self.build_column_mapping()

    def generate(self):
        self.workbook = load_workbook(str(self.TEMPLATE_PATH))
        self.worksheet = self.workbook[self.SHEET_NAME]
        self._write_data_rows()

        return self._create_response()

    def _write_data_rows(self):
        """Write all project report data to the worksheet."""
        # The template's first data row is used as a formatting source for all other rows
        template_row = self.FIRST_DATA_ROW

        # Delete any extra template rows (if present)
        # We'll keep just the first template row and duplicate it...
        if self.worksheet.max_row > template_row:
            self.worksheet.delete_rows(
                template_row + 1, self.worksheet.max_row - template_row
            )

        for idx, report_data in enumerate(self.project_reports_data):
            current_row = self.FIRST_DATA_ROW + idx
            if idx > 0:
                self._copy_row_style(template_row, current_row)

            self._write_row_data(current_row, report_data)

    def _copy_row_style(self, source_row, target_row):
        self.worksheet.insert_rows(target_row)

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
        value = report_data.get(field_name)

        if value is None:
            return None

        if field_name.startswith("date_"):
            # Format dates
            if isinstance(value, str):
                try:
                    # Parse ISO date string
                    return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
                except (ValueError, AttributeError):
                    return value
            return value

        # Format numbers (convert to float for Excel)
        if isinstance(value, (int, float, Decimal)):
            return float(value)

            return str(value) if value else None

    def _create_response(self):
        safe_agency_name = "".join(
            c for c in self.agency_name if c.isalnum() or c in (" ", "-", "_")
        ).strip()
        filename = f"APR_{self.year}_{safe_agency_name}.xlsx"

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        self.workbook.save(response)
        return response
