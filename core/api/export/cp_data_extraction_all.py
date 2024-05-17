from core.api.export.base import BaseWriter


class CPPricesExtractionWriter(BaseWriter):
    header_row_start_idx = 1

    def __init__(self, wb, year):
        headers = [
            {
                "id": "country_name",
                "headerName": "Country",
            },
            {
                "id": "chemical_name",
                "headerName": "Chemicals",
            },
            {
                "id": "previous_year_price",
                "headerName": "Previous Year Price",
            },
            {
                "id": "current_year_price",
                "headerName": str(year),
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
                value = price.get_chemical_display_name()
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
            )


class CPDetailsExtractionWriter(BaseWriter):
    header_row_start_idx = 1

    def __init__(self, wb, year):
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
            },
            {
                "id": "substance_gwp",
                "headerName": "GWP for HFC",
            },
            {
                "id": "record_value",
                "headerName": str(year),
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
            elif header_id == "substance_name":
                value = record.get_chemical_display_name()
            elif header_id == "substance_group":
                value = record.substance.group.group_id if record.substance else "F"
            elif header_id == "substance_odp":
                value = record.get_chemical_odp()
            elif header_id == "substance_gwp":
                value = record.get_chemical_gwp()
            elif header_id == "record_value":
                value = record.get_consumption_value()
            else:
                value = getattr(record, header_id, None)

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
            )


class CPConsumptionODPWriter(BaseWriter):
    header_row_start_idx = 1

    def __init__(self, wb, year):
        headers = [
            {
                "id": "country_name",
                "headerName": "Country",
            },
            {
                "id": "substance_name",
                "headerName": "Substances",
            },
            {
                "id": "record_value",
                "headerName": str(year),
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
            "country_name": {
                "substance_category": consumption_value,
                ...
            },
            ...
        }
        """
        row_idx = self.header_row_end_idx + 1
        for country, country_data in data.items():
            if not country_data:
                continue
            for subst_cat, cons_value in country_data.items():
                self._write_row(row_idx, country, subst_cat, cons_value)
                row_idx += 1

    def _write_row(self, row_idx, country, subst_cat, cons_value):
        for header_id, header in self.headers.items():
            if header_id == "country_name":
                value = country
            elif header_id == "substance_name":
                value = subst_cat
            elif header_id == "record_value":
                value = cons_value
            else:
                value = None

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
            )


class CPHFCConsumptionMTCO2Writer(BaseWriter):
    header_row_start_idx = 1

    def __init__(self, wb, year):
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
            {
                "id": "consumption_mt",
                "headerName": f"{year} (MT)",
            },
            {
                "id": "consumption_co2",
                "headerName": f"{year} (MT CO2-eq)",
            },
            {
                "id": "servicing",
                "headerName": f"{year} (MT) - Servicing",
            },
            {
                "id": "usages_total",
                "headerName": f"{year} (MT) - Use By Sector Total",
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
            "country_name": {
                "substance_group": value,
                "consumption_mt": value,
                "consumption_co2": value,
                "servicing": value,
                "usages_total": value,
            },
            ...
        }
        """
        row_idx = self.header_row_end_idx + 1
        for country, country_data in data.items():
            if not country_data:
                continue
            self._write_row(row_idx, country, country_data)

    def _write_row(self, row_idx, country, values):
        for header_id, header in self.headers.items():
            if header_id == "country_name":
                value = country
            elif header_id == "country_lvc":
                value = "LVC" if values["country_lvc"] else "Non-LVC"
            else:
                value = values.get(header_id, None)

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
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
            },
            {
                "id": "feedstock",
                "headerName": "Captured for feedstock uses within your country",
            },
            {
                "id": "destruction",
                "headerName": "Captured for destruction",
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
            self._write_record_row(row_idx, record)
            row_idx += 1

    def _write_record_row(self, row_idx, record):
        for header_id, header in self.headers.items():
            if header_id == "country_name":
                value = record.country_programme_report.country.name
            elif header_id == "substance_name":
                value = "HFC-23"
            else:
                value = getattr(record, header_id, None)

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
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
            },
            {
                "id": "all_uses",
                "headerName": "Amount generated and captured - For all uses",
            },
            {
                "id": "feedstock_gc",
                "headerName": (
                    "Amount generated and captured "
                    "- For feedstock use in your country"
                ),
            },
            {
                "id": "destruction",
                "headerName": "Amount generated and captured - For destruction",
            },
            {
                "id": "feedstock_wpc",
                "headerName": "Amount used for feedstock without prior capture",
            },
            {
                "id": "destruction_wpc",
                "headerName": "Amount destroyed without prior capture",
            },
            {
                "id": "generated_emissions",
                "headerName": "Amount of generated emissions",
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
            )
