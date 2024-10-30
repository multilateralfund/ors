from datetime import datetime
from decimal import Decimal
from openpyxl.cell import WriteOnlyCell
from openpyxl.styles import Font, Side, Border, Alignment
from openpyxl.utils import range_boundaries

from core.api.export.base import WriteOnlyBase

EMPTY_ROW = (None, None, None)


class DashboardWriter(WriteOnlyBase):
    COLUMN_WIDTH = 25

    def set_dimensions(self):
        self.sheet.column_dimensions["A"].width = self.COLUMN_WIDTH * 2
        self.sheet.column_dimensions["B"].width = self.COLUMN_WIDTH
        self.sheet.column_dimensions["C"].width = self.COLUMN_WIDTH

    def write_data(self, data):
        for key, cell_b, cell_c in data:
            record_row = []
            if cell_b is None and cell_c is None:
                record_row.append(self.write_header_cell(key))
            else:
                record_row.append(self.write_record_cell(key))

            record_row.append(self.write_record_cell(cell_b))
            record_row.append(self.write_record_cell(cell_c))

            self.sheet.append(record_row)
        # Merge cells for title, subtitle and date
        self.sheet.merge_cells("A4:C4")
        self.sheet.merge_cells("A6:C6")
        self.sheet.merge_cells("A5:C5")
        for row in range(4, 7):
            self.sheet.row_dimensions[row].height = 30
            self.sheet.cell(row=row, column=1).alignment = Alignment(
                horizontal="center", vertical="center", wrap_text=True
            )

    def write_header_cell(self, value, comment=None):
        cell = WriteOnlyCell(self.sheet, value=value)
        cell.font = Font(name="Times New Roman", bold=True)
        cell.border = Border(
            top=Side(style="thin"),
            left=Side(style="thin"),
            right=Side(style="thin"),
            bottom=Side(style="thin"),
        )
        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        return cell

    def write_record_cell(self, value, read_only=False):
        cell = WriteOnlyCell(self.sheet, value=value)
        cell.font = Font(name="Times New Roman")
        cell.border = Border(
            top=Side(style="thin"),
            left=Side(style="thin"),
            right=Side(style="thin"),
            bottom=Side(style="thin"),
        )
        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        if type(value) in (float, Decimal):
            cell.number_format = "###,###,##0.00###"

        return cell


class StatusOfContributionsWriter(WriteOnlyBase):
    BOLD_RECORD_CELLS = ["TOTAL", "SUB-TOTAL"]

    def __init__(self, sheet, period=None, extra_headers=None):
        headers = [
            {
                "id": "country",
                "headerName": "Party",
                "column_width": 25,
            },
            {
                "id": "agreed_contributions",
                "headerName": "Agreed contributions",
                "column_width": 25,
            },
            {
                "id": "cash_payments",
                "headerName": "Cash payments",
                "column_width": 25,
            },
            {
                "id": "bilateral_assistance",
                "headerName": "Bilateral assistance",
                "column_width": 25,
            },
            {
                "id": "promissory_notes",
                "headerName": "Promissory notes",
                "column_width": 25,
            },
            {
                "id": "outstanding_contributions",
                "headerName": "Outstanding contributions",
                "column_width": 25,
            },
        ]

        if extra_headers:
            headers.extend(extra_headers)
        self.period = period
        super().__init__(sheet, headers)

    def do_prewriting(self):
        # Merge cells for title, subtitle and date
        columns_number = len(self.headers)
        self.sheet.merge_cells(
            start_row=5, start_column=1, end_row=5, end_column=columns_number
        )
        self.sheet.merge_cells(
            start_row=6, start_column=1, end_row=6, end_column=columns_number
        )
        self.sheet.merge_cells(
            start_row=7, start_column=1, end_row=7, end_column=columns_number
        )
        self.sheet.merge_cells(
            start_row=8, start_column=1, end_row=8, end_column=columns_number
        )
        self.sheet.cell(row=5, column=1).alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        self.sheet.cell(row=6, column=1).alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        self.sheet.cell(row=7, column=1).alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        self.sheet.cell(row=5, column=1).value = (
            "TRUST  FUND FOR THE  MULTILATERAL FUND FOR THE IMPLEMENTATION OF THE MONTREAL PROTOCOL"
        )
        self.sheet.cell(row=6, column=1).value = (
            f"Status of Contributions for {self.period} (US$)"
        )
        self.sheet.cell(row=7, column=1).value = "As at 24/05/2024"

    def write(self, data):
        self.do_prewriting()
        super().write(data)

    def write_header_cell(self, value, comment=None):
        cell = super().write_header_cell(value, comment)
        cell.font = Font(name="Times New Roman", bold=True)
        return cell

    def write_record_cell(self, value, read_only=False):
        cell = super().write_record_cell(value, read_only)
        if type(value) in (float, Decimal):
            cell.number_format = "###,###,##0.00###"

        if any(bold_string == value for bold_string in self.BOLD_RECORD_CELLS):
            cell.border = Border(
                top=Side(style="thick"),
                bottom=Side(style="thick"),
            )
            cell.font = Font(name="Times New Roman", bold=True)

        return cell


class StatisticsStatusOfContributionsWriter(WriteOnlyBase):
    BOLD_RECORD_CELLS = [
        "Total payments",
        "Interest earned",
        "Miscellaneous income",
        "TOTAL INCOME",
        "Accumulated figures",
    ]

    def __init__(self, sheet, headers, period=None):
        self.headers = headers
        self.period = period
        super().__init__(sheet, headers)

    def do_prewriting(self):
        # Merge cells for title, subtitle and date
        columns_number = len(self.headers)
        self.sheet.merge_cells(
            start_row=5, start_column=1, end_row=5, end_column=columns_number
        )
        self.sheet.merge_cells(
            start_row=6, start_column=1, end_row=6, end_column=columns_number
        )
        self.sheet.merge_cells(
            start_row=7, start_column=1, end_row=7, end_column=columns_number
        )
        self.sheet.merge_cells(
            start_row=8, start_column=1, end_row=8, end_column=columns_number
        )
        self.sheet.cell(row=5, column=1).alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        self.sheet.cell(row=6, column=1).alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        self.sheet.cell(row=7, column=1).alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        self.sheet.cell(row=8, column=1).alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        self.sheet.cell(row=5, column=1).value = (
            "TRUST  FUND FOR THE  MULTILATERAL FUND FOR THE IMPLEMENTATION OF THE MONTREAL PROTOCOL"
        )
        self.sheet.cell(row=6, column=1).value = (
            f"{self.period} SUMMARY STATUS OF CONTRIBUTIONS AND OTHER INCOME (US$)"
        )
        self.sheet.cell(row=7, column=1).value = (
            "BALANCE  AVAILABLE   FOR  NEW  ALLOCATIONS"
        )
        self.sheet.cell(row=8, column=1).value = "As at 24/05/2024"

    def write(self, data):
        self.do_prewriting()
        super().write(data)

    def write_header_cell(self, value, comment=None):
        cell = super().write_header_cell(value, comment)
        cell.font = Font(name="Times New Roman", bold=True)
        return cell

    def write_record_cell(self, value, read_only=False):
        cell = super().write_record_cell(value, read_only)
        if type(value) in (float, Decimal):
            cell.number_format = "###,###,##0.00###"

        if any(bold_string == value for bold_string in self.BOLD_RECORD_CELLS):
            cell.font = Font(name="Times New Roman", bold=True)

        return cell


class ScaleOfAssessmentWriter(WriteOnlyBase):
    # pylint: disable=too-many-arguments
    def __init__(
        self,
        sheet,
        past_un_period=None,
        past_period=None,
        current_period=None,
        ferm_year=None,
        comment=None,
    ):
        headers = [
            {
                "id": "no",
                "headerName": "No",
                "column_width": 5,
            },
            {
                "id": "country",
                "headerName": "Country",
                "column_width": 25,
            },
            {
                "id": "un_scale_of_assessment",
                "headerName": f"United Nations Scale of Assessment for the period {past_un_period}",
                "column_width": 25,
            },
            {
                "id": "adjusted_scale_of_assessment",
                "headerName": f"Adjusted UN Scale of Assessment using"
                f"{past_un_period} scale with no party "
                f"contributing more than 22%",
                "column_width": 25,
            },
            {
                "id": "yearly_amount",
                "headerName": f"Annual contributions for years {current_period} in (United States Dollar)",
                "column_width": 25,
            },
            {
                "id": "average_inflation_rate",
                "headerName": f"Average inflation rate for the period {past_period} (percent)",
                "column_width": 25,
            },
            {
                "id": "qualifies_for_fixed_rate_mechanism",
                "headerName": "Qualifying for fixed exchange rate mechanism",
                "column_width": 25,
            },
            {
                "id": "exchange_rate",
                "headerName": f"Fixed exchange rate mechanism users' "
                f"currencies rate of Exchange 01 Jan - 30 June "
                f"{ferm_year}",
                "column_width": 25,
            },
            {
                "id": "currency",
                "headerName": "Fixed exchange mechanism users national currencies",
                "column_width": 25,
            },
            {
                "id": "yearly_amount_local_currency",
                "headerName": "Fixed exchange mechanism users contribution "
                "amount in national currencies",
                "column_width": 25,
            },
        ]
        self.comment = comment
        super().__init__(sheet, headers)

    def write_header_cell(self, value, comment=None):
        cell = super().write_header_cell(value, comment)
        cell.font = Font(name="Times New Roman", bold=True)
        return cell

    def write_record_cell(self, value, read_only=False):
        cell = super().write_record_cell(value, read_only)
        if type(value) in (float, Decimal):
            cell.number_format = "###,###,##0.00###"
        cell.font = Font(name="Times New Roman")
        return cell

    def add_comments(self, merge_row):
        self.sheet.append([])
        self.sheet.merge_cells(
            start_row=merge_row,
            start_column=1,
            end_row=merge_row,
            end_column=10,
        )
        self.sheet.cell(row=merge_row, column=1).value = self.comment

    def write(self, data):
        super().write(data)
        # Data, header, total, empty row
        self.add_comments(len(data) + 3)


class BaseTemplateSheetWriter:
    """
    Base class for writing sheets based on an existing preloaded template sheet.

    No cell formatting, merging or table formatting are needed;
    just filling out values.

    Assumes a certain format of the template file, but easily configurable.
    """

    DATA_MAPPING = {}
    HEADERS_ROW = 1
    TEMPLATE_FIRST_DATA_ROW = 2
    TEMPLATE_LAST_DATA_ROW = 50

    def __init__(
        self,
        sheet,
        data,
        number_of_rows,
        start_year,
    ):
        self.sheet = sheet
        self.data = data
        self.number_of_rows = number_of_rows
        self.start_year = start_year

    def write_headers(self):
        pass

    def _delete_middle_rows(self, rows_number):
        start_row = self.TEMPLATE_FIRST_DATA_ROW + 1
        self.sheet.delete_rows(start_row, rows_number)

        # Shift merged cells to avoid footer breaking down
        merged_cells_range = self.sheet.merged_cells.ranges
        for merged_cell in merged_cells_range:
            min_col, min_row, max_col, max_row = range_boundaries(str(merged_cell))
            if min_row >= start_row:
                merged_cell.shift(0, -1 * rows_number)

    def _add_middle_rows(self, extra_rows):
        start_row = self.TEMPLATE_FIRST_DATA_ROW + 2

        # Shift merged cells to avoid footer breaking down
        merged_cells_range = self.sheet.merged_cells.ranges
        for merged_cell in merged_cells_range:
            min_col, min_row, max_col, max_row = range_boundaries(str(merged_cell))
            if min_row >= start_row:
                merged_cell.shift(0, extra_rows)

        # TODO: need to also copy row styles
        self.sheet.insert_rows(start_row, extra_rows)

    def write(self):
        """
        Writes the entire sheet.
        """
        # Overwrite headers
        self.write_headers()

        # Before writing, we need to:
        # - delete any extra rows that the template MIGHT have OR
        # - add any needed rows, copying an existing intermediate row's style
        template_data_rows_number = (
            self.TEMPLATE_LAST_DATA_ROW - self.TEMPLATE_FIRST_DATA_ROW + 1
        )
        data_rows_number = len(self.data)
        extra_rows = data_rows_number - template_data_rows_number
        if extra_rows < 0:
            self._delete_middle_rows(-1 * extra_rows)
        elif extra_rows > 0:
            self._add_middle_rows(extra_rows)

        # Write data
        for row_data in self.data:
            self.write_row(row_data, row_data["no"])

    def write_row(self, row_data, index):
        """
        Writing row values for data rows.

        Totals row is calculated via formulas, leaving it alone.
        """
        row_to_overwrite = self.TEMPLATE_FIRST_DATA_ROW + index - 1
        for key in row_data.keys():
            if self.DATA_MAPPING.get(key) is None:
                continue
            column = self.DATA_MAPPING[key]["column"]
            cell = self.sheet.cell(row=row_to_overwrite, column=column)
            self.write_cell(
                cell,
                self.DATA_MAPPING[key].get("type"),
                # TODO: maybe I should just leave the format be!
                self.DATA_MAPPING[key].get("format"),
                row_data[key],
            )

    def write_cell(self, cell, type, format, value):
        cell.value = value
        if type in (Decimal, float) and format is not None:
            cell.number_format = format


class ScaleOfAssessmentTemplateWriter(BaseTemplateSheetWriter):
    """
    Template sheet writer for SoA.
    """

    # Position and formatting for each filed from the serializer data rows
    DATA_MAPPING = {
        "no": {
            "column": 1,
            "type": int,
        },
        "country": {
            "column": 2,
            "type": str,
        },
        "un_scale_of_assessment": {
            "column": 3,
            "type": Decimal,
            "number_format": "###,###,##0.00###",
        },
        "adjusted_scale_of_assessment": {
            "column": 4,
            "type": Decimal,
            "number_format": "###,###,##0.00###",
        },
        "yearly_amount": {
            "column": 5,
            "type": Decimal,
            "number_format": "###,###,##0.00###",
        },
        "average_inflation_rate": {
            "column": 6,
            "type": Decimal,
            "number_format": "###,###,##0.00###",
        },
        "qualifies_for_fixed_rate_mechanism": {
            "column": 7,
            "type": bool,
        },
        "exchange_rate": {
            "column": 8,
            "type": Decimal,
            "number_format": "###,###,##0.00###",
        },
        # There is an empty column here, hence going from 8 to 10
        "currency": {
            "column": 10,
            "type": str,
        },
        # Another empty column here
        "yearly_amount_local_currency": {
            "column": 12,
            "type": Decimal,
            "number_format": "###,###,##0.00###",
        },
    }

    HEADERS_ROW = 1
    TEMPLATE_FIRST_DATA_ROW = 2
    TEMPLATE_LAST_DATA_ROW = 50

    def write_headers(self):
        for key, item in self.DATA_MAPPING.items():
            cell = self.sheet.cell(self.HEADERS_ROW, item["column"])
            value = cell.value
            if value and "2022-24" in value:
                cell.value = value.replace(
                    "2022-24", f"{self.start_year}-{self.start_year+2}"
                )


class StatusOfTheFundTemplateWriter(BaseTemplateSheetWriter):
    """
    Template sheet writer for SoA.
    """

    # Position and formatting for each filed from the serializer data rows
    DATA_MAPPING = {
        "3": {
            "column": 3,
            "type": Decimal,
            "number_format": "###,###,##0",
        },
        "4": {
            "column": 4,
            "type": Decimal,
            "number_format": "###,###,##0",
        },
    }

    TEMPLATE_FIRST_DATA_ROW = 12
    TEMPLATE_LAST_DATA_ROW = 42

    def write(self):
        # Here data comes as tuples; no need for row shifting
        # TODO: maybe add write_header?
        for index, row_data in enumerate(self.data):
            self.write_row(row_data, index)

    def write_row(self, row_data, index):
        """
        Writing row values for data rows.

        Here the values come as tuples and we need to do the mapping directly.
        """
        row_to_overwrite = self.TEMPLATE_FIRST_DATA_ROW + index

        # Skip empty rows
        if row_data is None:
            return
        if all(cell_data is None for cell_data in row_data):
            return

        for index, cell_data in enumerate(row_data[1:]):
            if cell_data is None:
                continue
            key = str(index + 3)
            column = self.DATA_MAPPING[key]["column"]
            cell = self.sheet.cell(row=row_to_overwrite, column=column)
            self.write_cell(
                cell,
                self.DATA_MAPPING[key].get("type"),
                # TODO: maybe I should just leave the format be!
                self.DATA_MAPPING[key].get("format"),
                cell_data,
            )


class StatisticsTemplateWriter(BaseTemplateSheetWriter):
    """
    Template sheet writer for Statistics.
    """

    # All header cells are on column 1
    HEADER_COLUMN = 2
    TABLE_DESCRIPTION_ROW = 7
    AS_OF_ROW = 9

    TEMPLATE_FIRST_DATA_ROW = 11
    TEMPLATE_LAST_DATA_ROW = 35
    TEMPLATE_FIRST_DATA_COLUMN = 3

    def write_headers(self):
        description_cell = self.sheet.cell(
            row=self.TABLE_DESCRIPTION_ROW, column=self.HEADER_COLUMN
        )
        value = description_cell.value
        current_year = datetime.now().year
        description_cell.value = value.replace("2024", str(current_year))

    def write(self):
        self.write_headers()
        for column_index, triennial_data in enumerate(self.data):
            for row_key in triennial_data.keys():
                row_to_overwrite = self.TEMPLATE_FIRST_DATA_ROW + row_key
                column_to_overwrite = self.TEMPLATE_FIRST_DATA_COLUMN + column_index
                cell = self.sheet.cell(row=row_to_overwrite, column=column_to_overwrite)

                cell.value = triennial_data[row_key]


class StatusOfContributionsSummaryTemplateWriter(BaseTemplateSheetWriter):
    HEADERS_ROW = 1
    TEMPLATE_FIRST_DATA_ROW = 2
    TEMPLATE_LAST_DATA_ROW = 50

    # Position and formatting for each filed from the serializer data rows
    DATA_MAPPING = {
        "country": {
            "column": 2,
            "type": str,
        },
        "agreed_contributions": {
            "column": 3,
            "type": Decimal,
            "number_format": "###,###,##0",
        },
        "cash_payments": {
            "column": 4,
            "type": Decimal,
            "number_format": "###,###,##0",
        },
        "bilateral_assistance": {
            "column": 5,
            "type": Decimal,
            "number_format": "###,###,##0",
        },
        "promissory_notes": {
            "column": 6,
            "type": Decimal,
            "number_format": "###,###,##0",
        },
        "outstanding_contributions": {
            "column": 7,
            "type": Decimal,
            "number_format": "###,###,##0",
        },
        "gain_loss": {
            "column": 8,
            "type": Decimal,
            "number_format": "###,###,##0",
        },
    }
