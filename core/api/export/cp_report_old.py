from core.api.export.adm_export import AdmWriter
from core.api.export.base import CPReportBase
from core.api.export.base import COLUMN_WIDTH
from core.api.export.section_export import SectionWriter


class CPReportOldExporter(CPReportBase):
    sections = (
        "section_a",
        "adm_b",
        "adm_c",
        "section_c",
        "adm_d",
    )

    def export_section_a(self, sheet, data, usages):
        SectionWriter(
            sheet,
            [
                {
                    "id": "sheet-title",
                    "headerName": "SECTION A. Data on Controlled Substances (in METRIC TONNES)",
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
                            "id": "remarks",
                            "headerName": "Remarks",
                            "is_numeric": False,
                            "column_width": COLUMN_WIDTH * 2,
                        },
                    ],
                }
            ],
        ).write(data)

    def export_adm_b(self, sheet, data, usages):
        AdmWriter(
            sheet,
            [
                {
                    "id": "sheet-title",
                    "headerName": "ADM B. Regulatory, administrative and supportive actions",
                    "children": [
                        {
                            "id": "row-header-1",
                            "headerName": "Type of Action / Legislation",
                            "children": [
                                {
                                    "id": "index",
                                    "headerName": "",
                                    "is_row_header": True,
                                },
                                {
                                    "id": "text",
                                    "headerName": "",
                                    "is_row_header": True,
                                    "column_width": COLUMN_WIDTH * 6,
                                },
                            ],
                        },
                        *usages["columns"],
                        {
                            "id": "remarks",
                            "headerName": "Remarks",
                            "column_width": COLUMN_WIDTH * 2,
                        },
                    ],
                }
            ],
            usages["rows"],
        ).write(data)

    def export_adm_c(self, sheet, data, usages):
        AdmWriter(
            sheet,
            [
                {
                    "id": "sheet-title",
                    "headerName": "ADM C. Quantitative assessment of the phase-out programme",
                    "children": [
                        {
                            "id": "text",
                            "headerName": "Description",
                            "is_row_header": True,
                            "column_width": COLUMN_WIDTH * 6,
                        },
                        *usages["columns"],
                        {
                            "id": "remarks",
                            "headerName": "Remarks",
                            "column_width": COLUMN_WIDTH * 2,
                        },
                    ],
                }
            ],
            usages["rows"],
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

    def export_adm_d(self, sheet, data, usages):
        if self.cp_report.year <= 2011:
            header = "Qualitative assessment of the operation of RMP/NPP/TPMP"
        else:
            header = "Qualitative assessment of the operation of HPMP"

        AdmWriter(
            sheet,
            [
                {
                    "id": "sheet-title",
                    "headerName": f"ADM D. {header}",
                    "column_width": COLUMN_WIDTH * 16,
                    "children": [
                        {
                            "id": "text",
                            "headerName": "Question",
                            "is_row_header": True,
                            "column_width": COLUMN_WIDTH * 6,
                        },
                        {
                            "id": None,
                            "headerName": "Answer",
                            "column_width": COLUMN_WIDTH * 4,
                        },
                    ],
                }
            ],
            usages["rows"],
        ).write(data)
