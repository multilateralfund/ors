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
            },
            {
                "id": "imports",
                "headerName": "Import",
                "convert_to_odp": True,
            },
            {
                "id": "exports",
                "headerName": "Export",
                "convert_to_odp": True,
            },
            {
                "id": "production",
                "headerName": "Production",
                "convert_to_odp": True,
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
            value = record.get_chemical_display_name()
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
        for q_type, usages in [("(MT)", usages_mt), ("(CO2)", usages_co2)]:
            usages_headers.extend(
                [
                    *usages,
                    {
                        "id": f"total {q_type}",
                        "headerName": f"Total {q_type}",
                        "is_sum_function": True,
                        "quantity_type": q_type,
                    },
                    {
                        "id": f"imports {q_type}",
                        "headerName": f"Import {q_type}",
                        "quantity_type": q_type,
                    },
                    {
                        "id": f"exports {q_type}",
                        "headerName": f"Export{q_type}",
                        "quantity_type": q_type,
                    },
                    {
                        "id": f"production {q_type}",
                        "headerName": f"Production{q_type}",
                        "quantity_type": q_type,
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
            },
            {
                "id": "year",
                "headerName": "Year",
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

        # convert value to co2 equivalent if needed
        if quantity_type:
            value = value or 0
            if quantity_type == "(CO2)":
                value *= gwp

        return value