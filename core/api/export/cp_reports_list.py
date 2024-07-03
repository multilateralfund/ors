from core.api.export.base import BaseWriter


class CPReportListWriter(BaseWriter):
    header_row_start_idx = 1

    def __init__(self, wb):
        headers = [
            {
                "id": "country_name",
                "headerName": "Country Name",
            },
            {
                "id": "country_code",
                "headerName": "Country Code",
            },
            {
                "id": "year",
                "headerName": "Year",
                "type": "number",
                "align": "center",
            },
            {
                "id": "status",
                "headerName": "Status",
            },
            {
                "id": "version",
                "headerName": "Version",
                "type": "number",
                "align": "center",
            },
            {
                "id": "created_at",
                "headerName": "Last modified",
                "column_width": self.COLUMN_WIDTH * 2,
            },
            {
                "id": "created_by",
                "headerName": "Created By",
            },
        ]
        sheet = wb.create_sheet("CP Reports")
        super().__init__(sheet, headers)

    def write_data(self, data):
        row_idx = self.header_row_end_idx + 1
        for report in data:
            self._write_report_row(row_idx, report)
            row_idx += 1

    def _write_report_row(self, row_idx, report):
        for header_id, header in self.headers.items():
            if header_id == "country_name":
                value = report.country.name
            elif header_id == "country_code":
                value = report.country.iso3
            elif header_id == "created_at":
                value = report.created_at.strftime("%Y-%m-%d %H:%M:%S")
            elif header_id == "created_by":
                value = report.created_by.user_type
            else:
                value = getattr(report, header_id, None)

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
                align=header.get("align", "left"),
            )
