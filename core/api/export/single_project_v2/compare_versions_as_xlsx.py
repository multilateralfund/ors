from itertools import chain
from typing import Sequence

import openpyxl
from openpyxl.styles import DEFAULT_FONT
from openpyxl.styles import Alignment
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter

from core.api.export.base import configure_sheet_print
from core.api.utils import workbook_response
from core.models import Project

FIXED_FIELDS = (
    ("id", "Project ID"),
    ("mya_code", "MYA Code"),
    ("code", "Project Code"),
    ("country.name", "Country"),
    ("agency.name", "Agency"),
    ("cluster.name", "Cluster"),
    ("project_type.code", "Type"),
    ("sector.name", "Sector"),
    ("subsector.name", "Subsector"),
    ("title", "Title"),
)

VARIANCE_FIELDS = (
    ("total_fund", "Project funding ($ US)"),
    ("support_cost_psc", "Support Cost ($ US)"),
)


class CompareVersionsWriter:
    def __init__(self, sheet, candidates: Sequence[Project]):
        self.sheet = sheet
        self.candidates = candidates

    def write_headers(self, projects: Sequence[Project]):
        p1, p2 = list(projects)

        # Row 1
        row1 = [""] * len(FIXED_FIELDS)
        for _, label in VARIANCE_FIELDS:
            row1.extend([label, label, label])
        self.sheet.append(row1)

        # Row 2
        row2 = [label for _, label in FIXED_FIELDS]
        for _ in VARIANCE_FIELDS:
            row2.extend(
                [p1.submission_status.name, p2.submission_status.name, "Variance"]
            )
        self.sheet.append(row2)

        # Merge and style Row 1
        col_idx = len(FIXED_FIELDS) + 1
        for _ in VARIANCE_FIELDS:
            self.sheet.merge_cells(
                start_row=1, start_column=col_idx, end_row=1, end_column=col_idx + 2
            )
            cell = self.sheet.cell(row=1, column=col_idx)
            cell.font = Font(name=DEFAULT_FONT.name, bold=True)
            cell.alignment = Alignment(horizontal="center", vertical="center")
            col_idx += 3

        # Style Row 2
        for i in range(1, len(row2) + 1):
            cell = self.sheet.cell(row=2, column=i)
            cell.font = Font(name=DEFAULT_FONT.name, bold=True)
            cell.alignment = Alignment(
                horizontal="center", vertical="center", wrap_text=True
            )

    def write(self, projects: Sequence[Project]):
        p1, p2 = list(projects)

        data_row = []

        for field_id, _ in FIXED_FIELDS:
            data_row.append(self.get_value(field_id, p1.final_version))

        for field_id, _ in VARIANCE_FIELDS:
            v1 = self.get_value(field_id, p1)
            v2 = self.get_value(field_id, p2)

            variance = None
            if v1 is not None and v2 is not None:
                try:
                    variance = abs(v2 - v1)
                except TypeError:
                    pass
            data_row.extend([v1, v2, variance])

        self.sheet.append(data_row)

        row_idx = self.sheet.max_row
        col_idx = len(FIXED_FIELDS) + 1
        for _ in VARIANCE_FIELDS:
            for i in range(3):
                cell = self.sheet.cell(row=row_idx, column=col_idx + i)
                cell.number_format = "$###,###,##0.00#############"
            col_idx += 3

        for i in range(1, self.sheet.max_column + 1):
            self.sheet.column_dimensions[get_column_letter(i)].width = 20

    def get_value(self, name, project):
        last = None
        for n in name.split("."):
            if not last:
                last = getattr(project, n, None)
                continue

            if isinstance(last, (tuple, list, set)):
                last = [getattr(x, n) for x in last]
            elif isinstance(last, dict):
                last = last.get(n)
            else:
                last = getattr(last, n, None)

        return last


class CompareVersionsProjectExport:
    wb: openpyxl.Workbook
    candidates: Sequence[Sequence[Project]]

    def __init__(self, user, candidates: Sequence[Sequence[Project]]):
        self.user = user
        self.candidates = candidates
        self.setup_workbook()

    def setup_workbook(self):
        wb = openpyxl.Workbook()
        # delete default sheet
        del wb[wb.sheetnames[0]]
        sheet = wb.create_sheet("Comparison of versions")
        configure_sheet_print(sheet, "landscape")
        self.wb = wb
        self.sheet = sheet

    def export(self, filename: str):
        flat_candidates = list(chain(*self.candidates))
        writer = CompareVersionsWriter(self.sheet, flat_candidates)
        writer.write_headers(self.candidates[0])
        for pair in self.candidates:
            writer.write(pair)
        return workbook_response(filename, self.wb)
