import collections
import functools
import io

import openpyxl
import openpyxl.utils
import openpyxl.styles
from django.http import FileResponse
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from core.api.views.cp_records import CPRecordListView
from core.api.views.cp_report_empty_form import EmptyFormView


ROW_HEIGHT = 27
COLUMN_WIDTH = 15


class CPRecordExportView(CPRecordListView):
    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "cp_report_id",
                openapi.IN_QUERY,
                description="Country programme report id",
                type=openapi.TYPE_INTEGER,
            ),
        ],
    )
    def get(self, *args, **kwargs):
        cp_report = self._get_cp_report()
        data = self.get_data(cp_report)
        usages = EmptyFormView.get_data(cp_report)["usage_columns"]

        wb = openpyxl.Workbook()
        for section in ("a", "b", "c", "d", "e", "f"):
            sheet = wb.create_sheet(f"Section {section.upper()}")
            getattr(self, f"export_section_{section}")(
                sheet,
                data.get(f"section_{section}"),
                usages.get(f"section_{section}"),
            )

        # Remove the default sheet before saving
        wb.remove_sheet(wb.get_sheet_by_name(wb.get_sheet_names()[0]))

        # Save xlsx and return the response
        xls = io.BytesIO()
        wb.save(xls)
        xls.seek(0)
        return FileResponse(xls, as_attachment=True, filename=cp_report.name + ".xlsx")

    @functools.cached_property
    def _header_font(self):
        return openpyxl.styles.Font(name=openpyxl.styles.DEFAULT_FONT.name, bold=True)

    @functools.cached_property
    def _header_align(self):
        return openpyxl.styles.Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )

    @functools.cached_property
    def _header_bg_fill(self):
        return openpyxl.styles.PatternFill(
            start_color="CCCCCC", end_color="CCCCCC", fill_type="solid"
        )

    @functools.cached_property
    def _header_bg_excluded(self):
        return openpyxl.styles.PatternFill(
            start_color="EEEEEE", end_color="EEEEEE", fill_type="solid"
        )

    @functools.cached_property
    def _record_align(self):
        return openpyxl.styles.Alignment(
            horizontal="left", vertical="center", wrap_text=True
        )

    @functools.cached_property
    def _border(self):
        return openpyxl.styles.Border(
            left=openpyxl.styles.Side(style="thin"),
            right=openpyxl.styles.Side(style="thin"),
            top=openpyxl.styles.Side(style="thin"),
            bottom=openpyxl.styles.Side(style="thin"),
        )

    def _write_header_cell(self, sheet, row, column, value):
        cell = sheet.cell(row, column, value)
        cell.font = self._header_font
        cell.border = self._border
        cell.alignment = self._header_align
        cell.fill = self._header_bg_fill
        return cell

    def _write_record_cell(self, sheet, row, column, value, read_only=False):
        cell = sheet.cell(row, column, value)
        cell.alignment = self._record_align
        cell.border = self._border
        if read_only:
            cell.fill = self._header_bg_excluded
        return cell

    def _write_usage_headers(self, sheet, usages):
        parsed = {}

        def _compute_usages_positions(items, column=2, depth=0):
            max_depth = depth
            for item in items:
                start_column = column
                if "children" not in item:
                    column += 1
                    child_depth = depth
                else:
                    column, child_depth = _compute_usages_positions(
                        item["children"], column=column, depth=depth + 1
                    )

                max_depth = max(child_depth, max_depth)
                parsed[item["id"]] = {
                    "is_usage": True,
                    "is_numeric": True,
                    "value": item["headerName"],
                    "child_depth": child_depth - depth,
                    "start_column": start_column,
                    "end_column": column - 1,
                }
            return column, max_depth

        max_column, max_depth = _compute_usages_positions(usages)
        self._write_header_cell(sheet, 1, 2, "Use by Sector")
        sheet.merge_cells(start_row=1, start_column=2, end_row=1, end_column=max_column)

        # Excel row start at index 1 and add an extra one for the "Use by Sector" row
        last_header_row = max_depth + 2

        self._write_header_cell(sheet, last_header_row, 1, "Substance")
        for parsed_usage in parsed.values():
            row = last_header_row - parsed_usage["child_depth"]
            self._write_header_cell(
                sheet,
                row,
                parsed_usage["start_column"],
                parsed_usage["value"],
            )
            sheet.merge_cells(
                start_row=row,
                start_column=parsed_usage["start_column"],
                end_row=row,
                end_column=parsed_usage["end_column"],
            )

        fixed_headers = (
            ("total", "TOTAL", True),
            (
                "imports",
                "Import",
                True,
            ),
            ("exports", "Export", True),
            ("production", "Production", True),
            ("manufacturing_blends", "Manufacturing of Blends", True),
            ("import_quotas", "Import Quotas", True),
            ("banned_date", "Date ban commenced", False),
            ("remarks", "Remarks", False),
        )

        header_col = 0
        for header_col, (col_name, header, is_numeric) in enumerate(
            fixed_headers, start=max_column
        ):
            self._write_header_cell(
                sheet,
                last_header_row,
                header_col,
                header,
            )
            parsed[col_name] = {
                "child_depth": 0,
                "is_usage": False,
                "is_numeric": is_numeric,
                "start_column": header_col,
                "end_column": header_col,
            }

        for i in range(1, last_header_row + 1):
            sheet.row_dimensions[i].height = ROW_HEIGHT

            for j in range(1, header_col + 1):
                cell = sheet.cell(i, j)
                cell.fill = self._header_bg_fill
                cell.border = self._border

        return parsed, last_header_row + 1, header_col

    def _write_usage_row(self, sheet, headers, row, record):
        self._write_record_cell(sheet, row, 1, record["display_name"])
        excluded = set(record["excluded_usages"])
        by_usage_id = {
            item["usage_id"]: item["quantity"] for item in record["record_usages"]
        }
        for header_id, header in headers.items():
            if header["child_depth"] != 0:
                continue

            if header["is_usage"]:
                value = by_usage_id.get(header_id)
            else:
                value = record.get(header_id)

            read_only = False
            if header_id == "total":
                col_letter = openpyxl.utils.get_column_letter(
                    header["start_column"] - 1
                )
                value = f"=SUM(B{row}:{col_letter}{row})"
                read_only = True
            elif header_id in excluded:
                value = ""
                read_only = True
            elif header["is_numeric"]:
                value = float(value or 0)
            else:
                value = value or ""

            self._write_record_cell(
                sheet,
                row,
                header["start_column"],
                value,
                read_only=read_only,
            )

    def _write_subtotal_row(self, sheet, group_row_start, row, headers):
        sheet.row_dimensions[row].height = ROW_HEIGHT
        self._write_record_cell(sheet, row, 1, "Sub-Total")
        for header_id, header in headers.items():
            if header["child_depth"] != 0:
                continue

            col_idx = header["start_column"]
            col_letter = openpyxl.utils.get_column_letter(col_idx)

            value = ""
            if header["is_numeric"]:
                value = f"=SUM({col_letter}{group_row_start}:{col_letter}{row-1})"

            self._write_record_cell(
                sheet,
                row,
                col_idx,
                value,
                read_only=True,
            )

    def _export_usage_section(self, sheet, data, usages):
        headers, row, max_column = self._write_usage_headers(sheet, usages)
        sheet.column_dimensions["A"].width = COLUMN_WIDTH * 2
        for col_index in range(2, max_column + 1):
            sheet.column_dimensions[
                openpyxl.utils.get_column_letter(col_index)
            ].width = COLUMN_WIDTH

        current_group, group_row_start = None, None
        for record in data:
            if current_group != record["group"]:
                if group_row_start:
                    self._write_subtotal_row(sheet, group_row_start, row, headers)
                    row += 1

                current_group = record["group"]
                self._write_header_cell(sheet, row, 1, record["group"])
                sheet.merge_cells(
                    start_row=row, start_column=1, end_row=row, end_column=max_column
                )
                row += 1
                group_row_start = row

            self._write_usage_row(sheet, headers, row, record)
            sheet.row_dimensions[row].height = ROW_HEIGHT
            row += 1
        self._write_subtotal_row(sheet, group_row_start, row, headers)

    def export_section_a(self, sheet, data, usages):
        self._export_usage_section(sheet, data, usages)

    def export_section_b(self, sheet, data, usages):
        self._export_usage_section(sheet, data, usages)

    def export_section_c(self, sheet, data, usages):
        sheet.row_dimensions[1].height = ROW_HEIGHT
        for col_index, header in enumerate(
            ("Substance", "Previous year price", "Current prices", "Remarks"), start=1
        ):
            sheet.column_dimensions[
                openpyxl.utils.get_column_letter(col_index)
            ].width = (COLUMN_WIDTH * 2)
            self._write_header_cell(sheet, 1, col_index, header)

        max_column = 4
        row = 2
        current_group = None
        for record in data:
            if current_group != record["group"]:
                current_group = record["group"]
                self._write_header_cell(sheet, row, 1, record["group"])
                sheet.merge_cells(
                    start_row=row, start_column=1, end_row=row, end_column=max_column
                )
                row += 1
            for col_idx, key in enumerate(
                (
                    "display_name",
                    "previous_year_price",
                    "current_year_price",
                    "remarks",
                ),
                start=1,
            ):
                self._write_record_cell(sheet, row, col_idx, record.get(key))
            sheet.row_dimensions[row].height = ROW_HEIGHT
            row += 1

    def export_section_d(self, sheet, data, usages):
        sheet.row_dimensions[1].height = ROW_HEIGHT
        for col_idx, header in enumerate(
            (
                "Substance",
                "Captured for all uses",
                "Captured for feedstock uses within your country",
                "Captured for destruction",
            ),
            start=1,
        ):
            sheet.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = (
                COLUMN_WIDTH * 2
            )
            self._write_header_cell(sheet, 1, col_idx, header)

        row = 2
        for record in data:
            for col_idx, key in enumerate(
                (
                    "display_name",
                    "all_uses",
                    "feedstock",
                    "destruction",
                ),
                start=1,
            ):
                self._write_record_cell(sheet, row, col_idx, record.get(key))
            sheet.row_dimensions[row].height = ROW_HEIGHT
            row += 1

    def export_section_e(self, sheet, data, usages):
        pass

    def export_section_f(self, sheet, data, usages):
        pass
