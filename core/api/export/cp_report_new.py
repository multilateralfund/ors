from openpyxl.styles import Alignment

from core.api.export.base import CPReportBase
from core.api.export.base import COLUMN_WIDTH
from core.api.export.base import ROW_HEIGHT
from core.api.export.section_export import SectionWriter


class CPReportNewExporter(CPReportBase):
    sections = (
        "section_a",
        "section_b",
        "section_c",
        "section_d",
        "section_e",
        "section_f",
    )

    def export_section_a(self, sheet, data, usages):
        self._export_usage_section(
            sheet,
            data,
            usages,
            (
                "SECTION A. ANNEX A, ANNEX B, ANNEX C - GROUP I AND "
                "ANNEX E - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)"
            ),
        )

    def export_section_b(self, sheet, data, usages):
        self._export_usage_section(
            sheet,
            data,
            usages,
            "SECTION B. ANNEX F - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)",
        )

    def _export_usage_section(self, sheet, data, usages, title):
        SectionWriter(
            sheet,
            [
                {
                    "id": "sheet-title",
                    "headerName": title,
                    "children": [
                        {
                            "id": "display_name",
                            "headerName": "Substance",
                            "is_numeric": False,
                            "column_width": COLUMN_WIDTH * 2,
                        },
                        {
                            "id": "use-by-sector",
                            "headerName": "Use by Sector",
                            "children": [
                                *usages,
                                {
                                    "id": "total",
                                    "headerName": "TOTAL",
                                    "is_sum_function": True,
                                },
                            ],
                        },
                        {
                            "id": "imports",
                            "headerName": "Import",
                        },
                        {
                            "id": "exports",
                            "headerName": "Export",
                        },
                        {
                            "id": "production",
                            "headerName": "Production",
                        },
                        {
                            "id": "manufacturing_blends",
                            "headerName": "Manufacturing of Blends",
                        },
                        {
                            "id": "import_quotas",
                            "headerName": "Import Quotas",
                        },
                        {
                            "id": "banned_date",
                            "headerName": "Date ban commenced",
                            "is_numeric": False,
                        },
                        {
                            "id": "remarks",
                            "headerName": "Remarks",
                            "is_numeric": False,
                            "column_width": COLUMN_WIDTH * 2,
                        },
                    ],
                }
            ],
        ).write(data)

    def export_section_c(self, sheet, data, *args):
        SectionWriter(
            sheet,
            [
                {
                    "id": "sheet-title",
                    "headerName": "SECTION C. AVERAGE ESTIMATED PRICE OF HCFCs, HFCs AND ALTERNATIVES (US $/kg)",
                    "children": [
                        {
                            "id": "display_name",
                            "headerName": "Substance",
                            "is_numeric": False,
                            "column_width": COLUMN_WIDTH * 2,
                        },
                        {
                            "id": "previous_year_price",
                            "headerName": "Previous year price",
                            "column_width": COLUMN_WIDTH * 2,
                        },
                        {
                            "id": "current_year_price",
                            "headerName": "Current prices",
                            "column_width": COLUMN_WIDTH * 2,
                        },
                        {
                            "id": "remarks",
                            "headerName": "Remarks",
                            "is_numeric": False,
                            "column_width": COLUMN_WIDTH * 2,
                        },
                    ],
                }
            ],
        ).write(data)

    def export_section_d(self, sheet, data, *args):
        SectionWriter(
            sheet,
            [
                {
                    "id": "sheet-title",
                    "headerName": "SECTION D. ANNEX F, GROUP II - DATA ON HFC-23 GENERATION (METRIC TONNES)",
                    "children": [
                        {
                            "id": "display_name",
                            "headerName": "Substance",
                            "is_numeric": False,
                            "column_width": COLUMN_WIDTH * 2,
                        },
                        {
                            "id": "all_uses",
                            "headerName": "Captured for all uses",
                            "column_width": COLUMN_WIDTH * 2,
                        },
                        {
                            "id": "feedstock",
                            "headerName": "Captured for feedstock uses within your country",
                            "column_width": COLUMN_WIDTH * 2,
                        },
                        {
                            "id": "destruction",
                            "headerName": "Captured for destruction",
                            "column_width": COLUMN_WIDTH * 2,
                        },
                    ],
                }
            ],
        ).write(data)

    def export_section_e(self, sheet, data, *args):
        SectionWriter(
            sheet,
            [
                {
                    "id": "sheet-title",
                    "headerName": "SECTION E. ANNEX F, GROUP II - DATA ON HFC-23 EMISSIONS (METRIC TONNES)",
                    "children": [
                        {
                            "id": "facility",
                            "headerName": "Facility name or identifier",
                            "is_numeric": False,
                            "column_width": COLUMN_WIDTH * 2,
                        },
                        {
                            "id": "total",
                            "headerName": "Total amount generated",
                        },
                        {
                            "id": "amount-generated",
                            "headerName": "Amount generated and captured",
                            "children": [
                                {
                                    "id": "all_uses",
                                    "headerName": "For all uses",
                                    "column_width": COLUMN_WIDTH * 2,
                                },
                                {
                                    "id": "feedstock_gc",
                                    "headerName": "For feedstock use in your country",
                                    "column_width": COLUMN_WIDTH * 2,
                                },
                                {
                                    "id": "destruction",
                                    "headerName": "For destruction",
                                    "column_width": COLUMN_WIDTH * 2,
                                },
                            ],
                        },
                        {
                            "id": "feedstock_wpc",
                            "headerName": "Amount used for feedstock without prior capture",
                            "column_width": COLUMN_WIDTH * 2,
                        },
                        {
                            "id": " destruction_wpc",
                            "headerName": "Amount destroyed without prior capture",
                            "column_width": COLUMN_WIDTH * 2,
                        },
                        {
                            "id": "generated_emissions",
                            "headerName": "Amount of generated emission",
                            "column_width": COLUMN_WIDTH * 2,
                        },
                        {
                            "id": "remarks",
                            "headerName": "Remarks",
                            "is_numeric": False,
                            "column_width": COLUMN_WIDTH * 2,
                        },
                    ],
                }
            ],
        ).write(data)

    def export_section_f(self, sheet, data, *args):
        writer = SectionWriter(
            sheet,
            [
                {
                    "id": "sheet-title",
                    "headerName": "SECTION F. COMMENTS BY BILATERAL/IMPLEMENTING AGENCIES",
                    "children": [{"id": "remarks", "headerName": "Remarks"}],
                }
            ],
        )
        writer.write_headers()
        writer.set_dimensions()

        cell = sheet.cell(3, 1, data["remarks"])
        cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
        sheet.column_dimensions["A"].width = COLUMN_WIDTH * 8
        sheet.row_dimensions[3].height = ROW_HEIGHT * 16
