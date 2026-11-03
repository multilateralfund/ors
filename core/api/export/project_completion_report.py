from datetime import date

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


class PCRDueWriter(BaseWriter):
    """
    Writes the PCR due listing. The records are the serialized meta projects
    (PCRMetaProjectSerializer), so the values match the ones in the listing.
    """

    header_row_start_idx = 1

    def __init__(self, wb):
        headers = [
            {
                "id": "metacode",
                "headerName": "Metacode",
                "method": lambda record: record["umbrella_code"],
            },
            {
                "id": "title",
                "headerName": "Title",
                # only individual meta projects have the title in the listing
                "method": lambda record: (
                    record["projects"][0]["title"]
                    if record["type"] == "Individual" and record["projects"]
                    else None
                ),
                "column_width": 50,
            },
            {
                "id": "country",
                "headerName": "Country",
                "method": lambda record: record["country"],
            },
            {
                "id": "agency",
                "headerName": "Agency",
                "method": lambda record: record["lead_agency"],
            },
            {
                "id": "ad_hoc_pcr",
                "headerName": "Ad-hoc PCR",
                "method": lambda record: "Yes" if record["ad_hoc_pcr"] else "No",
            },
            {
                "id": "date_of_completion",
                "headerName": "Date completed",
                "method": lambda record: record["date_of_completion"],
                "type": "date",
            },
            {
                "id": "pcr_due_date",
                "headerName": "PCR due",
                "method": lambda record: record["pcr_due_date"],
                "type": "date",
            },
        ]
        sheet = wb.create_sheet("PCR due")
        super().__init__(sheet, headers)

    def write_data(self, data):
        for row_idx, record in enumerate(data, start=self.header_row_end_idx + 1):
            for header in self.headers.values():
                value = header["method"](record)
                if header.get("type") == "date" and value:
                    # serialized dates are ISO formatted strings
                    value = date.fromisoformat(value).strftime("%d.%m.%Y")

                self._write_record_cell(
                    row_idx,
                    header["column"],
                    value,
                    align=header.get("align", "left"),
                )
