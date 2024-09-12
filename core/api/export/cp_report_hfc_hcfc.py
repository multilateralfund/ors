from core.api.export.base import CPDataHFCHCFCWriterBase


class CPReportHCFCWriter(CPDataHFCHCFCWriterBase):
    header_row_start_idx = 1

    def __init__(self, wb, usages, year):
        headers = [
            {
                "id": "country_name",
                "headerName": "Country",
            },
            {
                "id": "chemical_name",
                "headerName": "Substance",
            },
            {
                "id": "country_category",
                "headerName": "Category",
            },
            {
                "id": "year",
                "headerName": "Year",
            },
            *usages,
            {
                "id": "total",
                "headerName": "Total",
                "is_sum_function": True,
                "convert_to_odp": True,
                "align": "right",
            },
            {
                "id": "imports",
                "headerName": "Import",
                "type": "number",
                "convert_to_odp": True,
                "align": "right",
            },
            {
                "id": "exports",
                "headerName": "Export",
                "type": "number",
                "convert_to_odp": True,
                "align": "right",
            },
            {
                "id": "production",
                "headerName": "Production",
                "type": "number",
                "convert_to_odp": True,
                "align": "right",
            },
            {
                "id": "remarks",
                "headerName": "Notes",
            },
        ]
        sheet = wb.create_sheet(str(year))
        super().__init__(sheet, headers)

    def get_value_for_header(self, header_id, header, record, by_usage_id):
        # delete quantity type from header_id
        value = None
        odp_value = record.get_chemical_odp()

        # set value for custom columns
        if header_id == "country_name":
            value = record.country_programme_report.country.name
        elif header_id == "chemical_name":
            value = record.display_name or record.get_chemical_display_name()
        elif header_id == "country_category":
            value = record.country_programme_report.country.consumption_category
        elif header.get("columnCategory") == "usage":
            value = by_usage_id.get(header_id) or 0
        elif header_id == "year":
            value = record.country_programme_report.year
        else:
            value = getattr(record, header_id, None)

        # convert value to odp equivalent if needed
        if header.get("convert_to_odp"):
            value = value or 0
            value *= odp_value

        return value


class CPReportHFCWriter(CPDataHFCHCFCWriterBase):
    header_row_start_idx = 1

    def __init__(self, wb, usages_mt, usages_co2, year):
        usages_headers = []
        for q_type, usages in [("(MT)", usages_mt), ("(CO₂-eq tonnes)", usages_co2)]:
            usages_headers.extend(
                [
                    *usages,
                    {
                        "id": f"total {q_type}",
                        "headerName": f"Total {q_type}",
                        "is_sum_function": True,
                        "quantity_type": q_type,
                        "align": "right",
                    },
                    {
                        "id": f"imports {q_type}",
                        "headerName": f"Import {q_type}",
                        "quantity_type": q_type,
                        "align": "right",
                    },
                    {
                        "id": f"exports {q_type}",
                        "headerName": f"Export{q_type}",
                        "quantity_type": q_type,
                        "align": "right",
                    },
                    {
                        "id": f"production {q_type}",
                        "headerName": f"Production{q_type}",
                        "quantity_type": q_type,
                        "align": "right",
                    },
                ]
            )
        headers = [
            {
                "id": "country_name",
                "headerName": "Country",
            },
            {
                "id": "country_is_lvc",
                "headerName": "Status",
                "columnCategory": "lvc_status",
            },
            {
                "id": "chemical_name",
                "headerName": "Chemical",
            },
            {
                "id": "chemical_gwp",
                "headerName": "GWP",
                "align": "right",
            },
            {
                "id": "year",
                "headerName": "Year",
                "align": "right",
            },
            *usages_headers,
            {
                "id": "remarks",
                "headerName": "Notes",
            },
        ]
        sheet = wb.create_sheet(str(year))
        super().__init__(sheet, headers)

    def get_value_for_header(self, header_id, header, record, by_usage_id):
        # delete quantity type from header_id
        value = None
        gwp = record.get_chemical_gwp()

        quantity_type = header.get("quantity_type")
        if quantity_type:
            header_id = header_id.replace(quantity_type, "").strip()

        # set value for custom columns
        if header_id == "country_name":
            value = record.country_programme_report.country.name
        elif header_id == "country_is_lvc":
            lvc_status = record.country_programme_report.country.is_lvc
            value = "LVC" if lvc_status else "Non-LVC"
        elif header_id == "chemical_name":
            value = record.get_chemical_display_name()
        elif header_id == "chemical_gwp":
            value = gwp
        elif header.get("columnCategory") == "usage":
            value = by_usage_id.get(header_id) or 0
        elif header_id == "year":
            value = record.country_programme_report.year
        else:
            value = getattr(record, header_id, None)

        # convert value to CO₂ equivalent if needed
        if quantity_type:
            value = value or 0
            if quantity_type == "(CO₂-eq tonnes)":
                value *= gwp

        return value
