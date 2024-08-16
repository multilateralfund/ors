from core.api.export.base import BaseWriter


class CPPricesExtractionWriter(BaseWriter):
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
                "align": "center",
            },
            {
                "id": "chemical_name",
                "headerName": "Chemicals",
            },
            {
                "id": "previous_year_price",
                "headerName": "Previous Year Price",
                "align": "right",
            },
            {
                "id": "current_year_price",
                "headerName": "Current year price",
                "align": "right",
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
        sheet = wb.create_sheet("ODSPrice")
        super().__init__(sheet, headers)

    def write_data(self, data):
        row_idx = self.header_row_end_idx + 1
        for price in data:
            self._write_price_row(row_idx, price)
            row_idx += 1

    def _write_price_row(self, row_idx, price):
        for header_id, header in self.headers.items():
            if header_id == "country_name":
                value = price.country_programme_report.country.name
            elif header_id == "chemical_name":
                value = price.display_name or price.get_chemical_display_name()
            elif header_id == "year":
                value = price.country_programme_report.year
            elif "price" in header_id:
                # try to convert the value to float else keep it as it is
                value = getattr(price, header_id, None)
                try:
                    value = float(value)
                except (TypeError, ValueError):
                    pass

            else:
                value = getattr(price, header_id, None)

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
                align=header.get("align", "left"),
            )


class CPDetailsExtractionWriter(BaseWriter):
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
                "align": "center",
                "type": "number",
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
            {
                "id": "record_value",
                "headerName": "Value",
                "align": "right",
                "type": "number",
            },
            {
                "id": "notes",
                "headerName": "Notes",
            },
        ]
        sheet = wb.create_sheet("CP-Details")
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
            elif header_id == "substance_name":
                value = record.display_name or record.get_chemical_display_name()
            elif header_id == "substance_group":
                value = record.substance.group.group_id if record.substance else "F"
            elif header_id == "substance_odp":
                value = record.get_chemical_odp()
            elif header_id == "substance_gwp":
                value = record.get_chemical_gwp()
            elif header_id == "record_value":
                if (
                    record.substance
                    and "methyl bromide" in record.substance.name.lower()
                ):
                    # For methyl bromide, the record value will be the non-QPS value
                    value = record.get_sectorial_total()
                else:
                    value = record.get_consumption_value()
            else:
                value = getattr(record, header_id, None)

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
                align=header.get("align", "left"),
            )


class CPConsumptionODPWriter(BaseWriter):
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
                "align": "center",
            },
            {
                "id": "substance_name",
                "headerName": "Substances",
            },
            {
                "id": "record_value",
                "headerName": "Record Value",
                "align": "right",
                "type": "number",
            },
            {
                "id": "notes",
                "headerName": "Notes",
            },
        ]
        sheet = wb.create_sheet("CPConsumption(ODP)")
        super().__init__(sheet, headers)

    def write_data(self, data):
        """
        Write data to the sheet
        @param data: dict
        structure:
        {
            "year": {
                "country_name": {
                    "substance_category": consumption_value,
                    ...
                },
                ...
            }
            ...
        }
        """
        row_idx = self.header_row_end_idx + 1
        for year, year_values in data.items():
            for country, country_data in year_values.items():
                if not country_data:
                    continue
                for subst_cat, cons_value in country_data.items():
                    self._write_row(row_idx, country, year, subst_cat, cons_value)
                    row_idx += 1

    def _write_row(self, row_idx, country, year, subst_cat, cons_value):
        for header_id, header in self.headers.items():
            if header_id == "country_name":
                value = country
            elif header_id == "substance_name":
                value = subst_cat
            elif header_id == "record_value":
                value = cons_value
            elif header_id == "year":
                value = year
            else:
                value = None

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
                align=header.get("align", "left"),
            )


class CPHFCConsumptionMTCO2Writer(BaseWriter):
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
                "align": "center",
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
            {
                "id": "consumption_mt",
                "headerName": "Consumption value (MT)",
                "align": "right",
                "type": "number",
            },
            {
                "id": "consumption_co2",
                "headerName": "Consumption value (MT CO2-eq)",
                "align": "right",
                "type": "number",
            },
            {
                "id": "servicing",
                "headerName": "Consumption value (MT) - Servicing",
                "align": "right",
                "type": "number",
            },
            {
                "id": "usages_total",
                "headerName": "Consumption value (MT) - Use By Sector Total",
                "align": "right",
                "type": "number",
            },
            {
                "id": "notes",
                "headerName": "Notes",
            },
        ]
        sheet = wb.create_sheet("HFC-Consumption(MTvsCO2Equi)")
        super().__init__(sheet, headers)

    def write_data(self, data):
        """
        Write data to the sheet
        @param data: dict
        structure:
        {
            "year": {
                "country_name": {
                    "substance_group": value,
                    "consumption_mt": value,
                    "consumption_co2": value,
                    "servicing": value,
                    "usages_total": value,
                },
                ...
            }
            ...
        }
        """
        row_idx = self.header_row_end_idx + 1
        for year, year_values in data.items():
            for country, country_data in year_values.items():
                if not country_data:
                    continue
                self._write_row(row_idx, country, year, country_data)
                row_idx += 1

    def _write_row(self, row_idx, country, year, values):
        for header_id, header in self.headers.items():
            if header_id == "country_name":
                value = country
            elif header_id == "year":
                value = year
            elif header_id == "country_lvc":
                value = "LVC" if values["country_lvc"] else "Non-LVC"
            else:
                value = values.get(header_id, None)

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
                align=header.get("align", "left"),
            )


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
                "id": "methyl_bromide_qps",
                "headerName": "Methyl Bromide - QPS",
                "align": "right",
                "type": "number",
            },
            {
                "id": "methyl_bromide_non_qps",
                "headerName": "Methyl Bromide — Non-QPS",
                "align": "right",
                "type": "number",
            },
            {
                "id": "total",
                "headerName": "Total",
                "align": "right",
                "type": "number",
            },
        ]
        sheet = wb.create_sheet("MbrConsumption")
        super().__init__(sheet, headers)
