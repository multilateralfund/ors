import openpyxl
from openpyxl.styles import Alignment
from openpyxl.styles import Border
from openpyxl.styles import PatternFill
from openpyxl.styles import Side
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter

ROW_HEIGHT = 30
COLUMN_WIDTH = 15


class SectionWriter:
    def __init__(self, sheet, headers):
        self.sheet = sheet
        self.headers = {}
        self.all_headers = {}

        nex_column_idx, max_header_depth = self._compute_header_positions(headers)
        # Excel row start at index 1
        self.last_header_row_idx = max_header_depth + 1
        self.max_column_idx = nex_column_idx - 1

    def write(self, data):
        self.write_headers()
        self.write_data(data)
        self.set_dimensions()
        # Freeze so top and side headers always stay visible.
        # Help with scrolling in the very large sections.
        self.sheet.freeze_panes = f"B{self.last_header_row_idx + 1}"

    def _compute_header_positions(self, items, column=1, depth=0):
        """Compute the positions of the headers depending on their hierarchy."""
        max_child_depth = depth
        for item in items:
            # Keep track of the start column, as the header might span over many
            # columns if it has more than one child; for those cases the cells need
            # to be merged.
            start_column = column
            if children := item.get("children"):
                column, child_depth = self._compute_header_positions(
                    children, column=column, depth=depth + 1
                )
            else:
                column += 1
                child_depth = depth
            max_child_depth = max(child_depth, max_child_depth)

            # Keep track of how many level of children this node is an
            # ancestor of.
            # Depending on this number, we'll position the header.
            header_child_depth = child_depth - depth
            header = {
                **item,
                "child_depth": header_child_depth,
                "column_letter": get_column_letter(start_column),
                "column": start_column,
                "end_column": column - 1,
            }
            self.all_headers[item["id"]] = header
            # If header has no children, keep track of them separately
            # as these are the places where values are actually added.
            if header_child_depth == 0:
                self.headers[item["id"]] = header

        return column, max_child_depth

    def _write_header_cell(self, row, column, value):
        cell = self.sheet.cell(row, column, value)
        cell.font = Font(name=openpyxl.styles.DEFAULT_FONT.name, bold=True)
        cell.border = Border(
            left=Side(style="thin"),
            right=Side(style="thin"),
            top=Side(style="thin"),
            bottom=Side(style="thin"),
        )
        cell.alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        cell.fill = PatternFill(
            start_color="CCCCCC", end_color="CCCCCC", fill_type="solid"
        )
        return cell

    def _write_record_cell(self, row, column, value, read_only=False):
        cell = self.sheet.cell(row, column, value)
        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        cell.border = Border(
            left=Side(style="hair"),
            right=Side(style="hair"),
            top=Side(style="hair"),
            bottom=Side(style="hair"),
        )
        if read_only:
            cell.fill = PatternFill(
                start_color="EEEEEE", end_color="EEEEEE", fill_type="solid"
            )
        return cell

    def write_headers(self):
        """Write the entire header structure and merge cells."""
        # Write empty values in the entire header range to ensure everything
        # has the same style.
        for i in range(1, self.last_header_row_idx + 1):
            for j in range(1, self.max_column_idx + 1):
                self._write_header_cell(i, j, "")

        for parsed_header in self.all_headers.values():
            row = self.last_header_row_idx - parsed_header["child_depth"]
            self._write_header_cell(
                row,
                parsed_header["column"],
                parsed_header["headerName"],
            )
            self.sheet.merge_cells(
                start_row=row,
                start_column=parsed_header["column"],
                end_row=row,
                end_column=parsed_header["end_column"],
            )

    def write_data(self, data):
        """Write data row by row:

        - Write group names if groups are present in the records.
        - Write sub-totals for each column of each group.
        - Write a final total row for each column.
        """
        row_idx = self.last_header_row_idx + 1
        group_ranges = []
        current_group, group_row_start_idx = None, None
        for record in data:
            new_group = record.get("group")
            if new_group and new_group != current_group:
                if group_row_start_idx:
                    group_ranges.append((group_row_start_idx, row_idx - 1))
                    self._write_subtotal_row(group_row_start_idx, row_idx)
                    row_idx += 1

                self._write_header_cell(row_idx, 1, new_group)
                self.sheet.merge_cells(
                    start_row=row_idx,
                    start_column=1,
                    end_row=row_idx,
                    end_column=self.max_column_idx,
                )

                row_idx += 1
                current_group = new_group
                group_row_start_idx = row_idx

            self._write_record_row(row_idx, record)
            row_idx += 1

        if group_row_start_idx:
            group_ranges.append((group_row_start_idx, row_idx - 1))
            self._write_subtotal_row(group_row_start_idx, row_idx)
            row_idx += 1
        else:
            # No groups in this section, make one big group instead
            group_ranges.append((self.last_header_row_idx + 1, row_idx - 1))

        self._write_total_row(row_idx, group_ranges)

    def set_dimensions(self):
        for header in self.headers.values():
            self.sheet.column_dimensions[header["column_letter"]].width = header.get(
                "column_width", COLUMN_WIDTH
            )

        for row in range(1, self.sheet.max_row + 1):
            self.sheet.row_dimensions[row].height = ROW_HEIGHT

    def _write_subtotal_row(self, group_row_start_idx, row_idx):
        self._write_record_cell(row_idx, 1, "Sub-total", read_only=True)
        for header in list(self.headers.values())[1:]:
            col = header["column_letter"]
            col_idx = header["column"]

            value = ""
            if header.get("is_numeric", True):
                value = f"=SUM({col}{group_row_start_idx}:{col}{row_idx-1})"

            self._write_record_cell(
                row_idx,
                col_idx,
                value,
                read_only=True,
            )

    def _write_record_row(self, row_idx, record):
        excluded = set(record.get("excluded_usages", []))
        by_usage_id = {
            item["usage_id"]: item["quantity"]
            for item in record.get("record_usages", [])
        }
        for header_id, header in self.headers.items():
            if header.get("columnCategory") == "usage":
                value = by_usage_id.get(header_id)
            else:
                value = record.get(header_id)

            read_only = False
            if header.get("is_sum_function"):
                col_letter = get_column_letter(header["column"] - 1)
                value = f"=SUM(B{row_idx}:{col_letter}{row_idx})"
                read_only = True
            elif header_id in excluded:
                value = ""
                read_only = True
            elif header.get("is_numeric", True):
                value = float(value or 0)
            else:
                value = value or ""

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
                read_only=read_only,
            )

    def _write_total_row(self, row_idx, group_ranges):
        self._write_header_cell(row_idx, 1, "TOTAL")
        for header in list(self.headers.values())[1:]:
            col_idx = header["column"]
            col = header["column_letter"]
            value = ""
            if header.get("is_numeric", True):
                ranges = ",".join(
                    [f"{col}{start}:{col}{end}" for start, end in group_ranges]
                )
                value = f"=SUM({ranges})"
            self._write_record_cell(row_idx, col_idx, value, read_only=True)
