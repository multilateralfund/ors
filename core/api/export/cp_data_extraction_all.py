from core.api.export.base import BaseWriter


class BaseExtractionAllWriter(BaseWriter):
    header_row_start_idx = 1

    def get_record_value_year_headers(self, min_year, max_year):
        value_headers = []
        for year in range(min_year, max_year + 1):
            value_headers.append(
                {
                    "id": f"record_value_{year}",
                    "headerName": f"Value {year} (MT)",
                    "align": "right",
                    "type": "number",
                },
            )
        return value_headers

    def write_data(self, data):
        row_idx = self.header_row_end_idx + 1
        for (country_name, chemical_name), record in data.items():
            self._write_record_row(row_idx, country_name, chemical_name, record)
            row_idx += 1

    def _write_record_row(self, row_idx, country_name, chemical_name, record):
        for header_id, header in self.headers.items():
            if header_id == "country_name":
                value = country_name
            elif header_id == "substance_name":
                value = chemical_name
            else:
                value = record.get(header_id, None)

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
                align=header.get("align", "left"),
            )


class CPPricesExtractionWriter(BaseExtractionAllWriter):

    def __init__(self, wb, min_year, max_year):
        year_headers = []
        for year in range(min_year, max_year + 1):
            year_headers.extend(
                [
                    {
                        "id": f"price_{year}",
                        "headerName": f"Price {year}",
                        "align": "right",
                    },
                    {
                        "id": f"fob_{year}",
                        "headerName": f"Fob Price {year}",
                    },
                    {
                        "id": f"retail_{year}",
                        "headerName": f"Retail Price {year}",
                    },
                    {
                        "id": f"remarks_{year}",
                        "headerName": f"Remarks {year} ",
                    },
                ]
            )
        headers = [
            {
                "id": "country_name",
                "headerName": "Country",
            },
            {
                "id": "chemical_name",
                "headerName": "Chemicals",
            },
            *year_headers,
            {
                "id": "notes",
                "headerName": "Notes",
            },
        ]
        sheet = wb.create_sheet("ODSPrice")
        super().__init__(sheet, headers)

    def _write_record_row(self, row_idx, country_name, chemical_name, record):
        for header_id, header in self.headers.items():
            if header_id == "country_name":
                value = country_name
            elif header_id == "chemical_name":
                value = chemical_name
            elif "price" in header_id:
                # try to convert the value to float else keep it as it is
                value = record.get(header_id, None)
                try:
                    value = float(value)
                except (TypeError, ValueError):
                    pass
            else:
                value = record.get(header_id, None)

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
                align=header.get("align", "left"),
            )


class CPDetailsExtractionWriter(BaseExtractionAllWriter):
    def __init__(self, wb, min_year, max_year):
        value_headers = self.get_record_value_year_headers(min_year, max_year)
        headers = [
            {
                "id": "country_name",
                "headerName": "Country",
            },
            {
                "id": "substance_group",
                "headerName": "Annex Group",
            },
            {
                "id": "substance_name",
                "headerName": "Substances",
            },
            {
                "id": "substance_odp",
                "headerName": "ODP Conversion for HCFC",
                "align": "right",
                "type": "number",
            },
            {
                "id": "substance_gwp",
                "headerName": "GWP for HFC",
                "align": "right",
                "type": "number",
            },
            *value_headers,
            {
                "id": "notes",
                "headerName": "Notes",
            },
        ]
        sheet = wb.create_sheet("CP-Details")
        super().__init__(sheet, headers)


class CPConsumptionODPWriter(BaseExtractionAllWriter):

    def __init__(self, wb, min_year, max_year):
        value_headers = self.get_record_value_year_headers(min_year, max_year)
        headers = [
            {
                "id": "country_name",
                "headerName": "Country",
            },
            {
                "id": "substance_name",
                "headerName": "Substances",
            },
            *value_headers,
            {
                "id": "notes",
                "headerName": "Notes",
            },
        ]
        sheet = wb.create_sheet("CPConsumption(ODP)")
        super().__init__(sheet, headers)


class CPHFCConsumptionMTCO2Writer(BaseExtractionAllWriter):
    def __init__(self, wb, min_year, max_year):
        consump_headers = []
        for year in range(min_year, max_year + 1):
            consump_headers.extend(
                [
                    {
                        "id": f"consumption_mt_{year}",
                        "headerName": f"Consumption value (MT) {year}",
                        "align": "right",
                        "type": "number",
                        "column_width": self.COLUMN_WIDTH * 2,
                    },
                    {
                        "id": f"consumption_co2_{year}",
                        "headerName": f"Consumption value (MT CO2-eq) {year}",
                        "align": "right",
                        "type": "number",
                        "column_width": self.COLUMN_WIDTH * 2,
                    },
                    {
                        "id": f"servicing_{year}",
                        "headerName": f"Consumption value (MT) - Servicing {year}",
                        "align": "right",
                        "type": "number",
                        "column_width": self.COLUMN_WIDTH * 2,
                    },
                    {
                        "id": f"usages_total_{year}",
                        "headerName": f"Consumption value (MT) - Use By Sector Total {year}",
                        "align": "right",
                        "type": "number",
                        "column_width": self.COLUMN_WIDTH * 2,
                    },
                ]
            )
        headers = [
            {
                "id": "country_name",
                "headerName": "Country",
            },
            {
                "id": "country_lvc",
                "headerName": "Status",
            },
            {
                "id": "substance_name",
                "headerName": "Substances",
            },
            {
                "id": "substance_group",
                "headerName": "Group",
            },
            *consump_headers,
            {
                "id": "notes",
                "headerName": "Notes",
            },
        ]
        sheet = wb.create_sheet("HFC-Consumption(MTvsCO2Equi)")
        super().__init__(sheet, headers)


class HFC23GenerationWriter(BaseWriter):
    header_row_start_idx = 1

    def __init__(self, wb):
        headers = [
            {
                "id": "country_name",
                "headerName": "Country",
            },
            {
                "id": "year",
                "headerName": "Year",
            },
            {
                "id": "substance_name",
                "headerName": "Substance",
            },
            {
                "id": "all_uses",
                "headerName": "Captured for all uses",
                "align": "right",
                "type": "number",
            },
            {
                "id": "feedstock",
                "headerName": "Captured for feedstock uses within your country",
                "align": "right",
                "type": "number",
            },
            {
                "id": "destruction",
                "headerName": "Captured for destruction",
                "align": "right",
                "type": "number",
            },
            {
                "id": "notes",
                "headerName": "Notes",
            },
        ]
        sheet = wb.create_sheet("HFC-23Generation")
        super().__init__(sheet, headers)

    def write_data(self, data):
        row_idx = self.header_row_end_idx + 1
        for record in data:
            # check if there is a column with non-zero value
            non_zero_value = False
            for col_name in ["all_uses", "feedstock", "destruction"]:
                if getattr(record, col_name):
                    non_zero_value = True
                    break
            # write the record only if there is a column with non-zero value
            if non_zero_value:
                self._write_record_row(row_idx, record)
                row_idx += 1

    def _write_record_row(self, row_idx, record):
        # write the record data
        for header_id, header in self.headers.items():
            if header_id == "country_name":
                value = record.country_programme_report.country.name
            elif header_id == "year":
                value = record.country_programme_report.year
            elif header_id == "substance_name":
                value = "HFC-23"
            else:
                value = getattr(record, header_id, None)

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
                align=header.get("align", "left"),
            )


class HFC23EmissionWriter(BaseWriter):
    header_row_start_idx = 1

    def __init__(self, wb):
        headers = [
            {
                "id": "country_name",
                "headerName": "Country",
            },
            {
                "id": "year",
                "headerName": "Year",
            },
            {
                "id": "facility",
                "headerName": "Facility name or identifier",
            },
            {
                "id": "total",
                "headerName": "Total amount generated",
                "align": "right",
                "type": "number",
            },
            {
                "id": "all_uses",
                "headerName": "Amount generated and captured - For all uses",
                "align": "right",
                "type": "number",
            },
            {
                "id": "feedstock_gc",
                "headerName": (
                    "Amount generated and captured "
                    "- For feedstock use in your country"
                ),
                "align": "right",
                "type": "number",
            },
            {
                "id": "destruction",
                "headerName": "Amount generated and captured - For destruction",
                "align": "right",
                "type": "number",
            },
            {
                "id": "feedstock_wpc",
                "headerName": "Amount used for feedstock without prior capture",
                "align": "right",
                "type": "number",
            },
            {
                "id": "destruction_wpc",
                "headerName": "Amount destroyed without prior capture",
                "align": "right",
                "type": "number",
            },
            {
                "id": "generated_emissions",
                "headerName": "Amount of generated emissions",
                "align": "right",
                "type": "number",
            },
            {
                "id": "remarks",
                "headerName": "Remarks",
            },
            {
                "id": "notes",
                "headerName": "Notes",
            },
        ]
        sheet = wb.create_sheet("HFC-23Emission")
        super().__init__(sheet, headers)

    def write_data(self, data):
        row_idx = self.header_row_end_idx + 1
        for record in data:
            self._write_record_row(row_idx, record)
            row_idx += 1

    def _write_record_row(self, row_idx, record):
        for header_id, header in self.headers.items():
            if header_id == "country_name":
                value = record.country_programme_report.country.name
            elif header_id == "year":
                value = record.country_programme_report.year
            else:
                value = getattr(record, header_id, None)

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
                align=header.get("align", "left"),
            )


class MbrConsumptionWriter(BaseWriter):
    header_row_start_idx = 1

    def __init__(self, wb, min_year, max_year):
        mbr_headers = []
        for year in range(min_year, max_year + 1):
            mbr_headers.extend(
                [
                    {
                        "id": f"methyl_bromide_qps_{year}",
                        "headerName": f"Methyl Bromide - QPS {year}",
                        "align": "right",
                        "type": "number",
                    },
                    {
                        "id": f"methyl_bromide_non_qps_{year}",
                        "headerName": f"Methyl Bromide — Non-QPS {year}",
                        "align": "right",
                        "type": "number",
                    },
                    {
                        "id": f"total_{year}",
                        "headerName": f"Total {year}",
                        "align": "right",
                        "type": "number",
                    },
                ]
            )
        headers = [
            {
                "id": "country_name",
                "headerName": "Country",
            },
            *mbr_headers,
        ]
        sheet = wb.create_sheet("MbrConsumption")
        super().__init__(sheet, headers)
