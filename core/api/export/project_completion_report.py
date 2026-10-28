from core.api.export.base import BaseWriter


class PCRSubmissionLogWriter(BaseWriter):
    header_row_start_idx = 1

    def __init__(self, wb):
        headers = [
            {
                "id": "project_metacode",
                "headerName": "Project metacode",
                "method": lambda record: record.project.metacode,
            },
            {
                "id": "project_code",
                "headerName": "Project code",
                "method": lambda record: record.project.code,
            },
            {
                "id": "country",
                "headerName": "Country",
                "method": lambda record: (
                    record.project.country.name if record.project.country else None
                ),
            },
            {
                "id": "cluster",
                "headerName": "Cluster",
                "method": lambda record: (
                    record.project.cluster.name if record.project.cluster else None
                ),
            },
            {
                "id": "title",
                "headerName": "Title",
                "method": lambda record: record.project.title,
                "column_width": 50,
            },
            {
                "id": "initial_submission_date",
                "headerName": "Initial submission date",
                "method": lambda record: record.pcr.submission_date,
                "type": "date",
            },
            {
                "id": "revised_submission_date",
                "headerName": "Revised submission date",
                "method": lambda record: record.pcr.revised_submission_date,
                "type": "date",
            },
            {
                "id": "locked",
                "headerName": "Locked",
                "method": lambda record: "Yes" if record.pcr.is_locked else "No",
            },
        ]
        sheet = wb.create_sheet("PCR submission log")
        super().__init__(sheet, headers)

    def write_data(self, data):
        for row_idx, record in enumerate(data, start=self.header_row_end_idx + 1):
            for header in self.headers.values():
                value = header["method"](record)
                if header.get("type") == "date" and value:
                    value = value.strftime("%d.%m.%Y")

                self._write_record_cell(
                    row_idx,
                    header["column"],
                    value,
                    align=header.get("align", "left"),
                )
