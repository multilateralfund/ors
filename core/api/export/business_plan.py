from core.api.export.base import BaseWriter


class BusinessPlanWriter(BaseWriter):
    header_row_start_idx = 1

    def __init__(self, sheet, min_year=None, max_year=None):
        year_headers = []

        if min_year and max_year:
            assert min_year < max_year, "min_year must be smaller than max_year"

            for year in range(min_year, max_year + 1):
                label = str(year)
                if year == max_year:
                    label = f"After {year - 1}"
                year_headers.extend(
                    [
                        {
                            "id": f"value_usd_{year}",
                            "headerName": f"Value ($000) {label}",
                            "type": "number",
                            "method": self.get_value,
                        },
                        {
                            "id": f"value_odp_{year}",
                            "headerName": f"ODP {label}",
                            "type": "number",
                            "method": self.get_value,
                        },
                        {
                            "id": f"value_mt_{year}",
                            "headerName": f"MT {label} for HFC",
                            "type": "number",
                            "method": self.get_value,
                        },
                    ]
                )

        headers = [
            {
                "id": "display_internal_id",
                "headerName": "Sort Order",
                "read_only": True,
                "column_width": self.COLUMN_WIDTH + 5,
            },
            {
                "id": "country",
                "headerName": "Country",
                "column_width": self.COLUMN_WIDTH * 2,
            },
            {
                "id": "agency",
                "headerName": "Agency",
            },
            {
                "id": "lvc_status",
                "headerName": "HCFC Status",
            },
            {
                "id": "project_type",
                "headerName": "Type",
            },
            {
                "id": "legacy_project_type",
                "headerName": "Legacy Type",
            },
            {
                "id": "bp_chemical_type",
                "headerName": "Chemical",
            },
            {
                "id": "chemical_detail",
                "headerName": "HCFC Chemical Detail",
            },
            {
                "id": "amount_polyol",
                "headerName": "Amount of Polyol in Project (MT)",
                "type": "number",
                "column_width": self.COLUMN_WIDTH * 1.5,
            },
            {"id": "project_cluster", "headerName": "Cluster"},
            {"id": "sector", "headerName": "Sector"},
            {"id": "subsector", "headerName": "Subsector"},
            {
                "id": "legacy_sector_and_subsector",
                "headerName": "Legacy Sector and Subsector",
            },
            {
                "id": "title",
                "headerName": "Title",
                "column_width": self.COLUMN_WIDTH * 4,
            },
            {
                "id": "required_by_model",
                "headerName": "Required by Model",
                "column_width": self.COLUMN_WIDTH * 2,
            },
            *year_headers,
            {
                "id": "reason_for_exceeding",
                "headerName": "Reason for exceeding 35% of baseline",
                "column_width": self.COLUMN_WIDTH * 2,
            },
            {
                "id": "status",
                "headerName": "A-Appr. P-Plan'd",
            },
            {
                "id": "is_multi_year",
                "headerName": "Is Multi Year",
                "type": "bool",
            },
            {
                "id": "remarks",
                "headerName": "Remarks",
                "column_width": self.COLUMN_WIDTH * 4,
            },
            {
                "id": "remarks_additional",
                "headerName": "Remarks (Additional)",
                "column_width": self.COLUMN_WIDTH * 4,
            },
            {
                "id": "comment_secretariat",
                "headerName": "Comment",
                "column_width": self.COLUMN_WIDTH * 4,
            },
        ]

        super().__init__(sheet, headers)

    def get_value(self, activity, header):
        attr, year = header["id"].rsplit("_", 1)
        is_after = bool("after" in header["headerName"].lower())
        if is_after:
            year = int(year) - 1

        for value in activity.get("values", []):
            if value["year"] == int(year) and value["is_after"] == is_after:
                return value[attr]
        return 0
