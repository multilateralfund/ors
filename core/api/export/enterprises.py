from core.api.export.base import BaseWriter
from core.models import EnterpriseOdsOdp


class EnterpriseWriter(BaseWriter):
    header_row_start_idx = 1

    def __init__(self, wb):
        headers = [
            {
                "id": "id",
                "headerName": "ID",
            },
            {
                "id": "code",
                "headerName": "Code",
            },
            {
                "id": "legacy_code",
                "headerName": "Legacy Code",
            },
            {
                "id": "name",
                "headerName": "Name",
            },
            {
                "id": "country.name",
                "headerName": "Country",
                "method": lambda record: (
                    record.country.name if record.country else None
                ),
            },
            {
                "id": "agency__name",
                "headerName": "Agency",
                "method": lambda record: record.agency.name if record.agency else None,
            },
            {
                "id": "location",
                "headerName": "Location",
            },
            {
                "id": "city",
                "headerName": "City",
            },
            {
                "id": "stage",
                "headerName": "Stage",
            },
            {
                "id": "sector_name",
                "headerName": "Sector",
                "method": lambda record: record.sector.name if record.sector else None,
            },
            {
                "id": "subsector_name",
                "headerName": "Sub-sector",
                "method": lambda record: (
                    record.subsector.name if record.subsector else None
                ),
            },
            {
                "id": "application",
                "headerName": "Application",
            },
            {
                "id": "project_type_name",
                "headerName": "Project Type",
                "method": lambda record: (
                    record.project_type.name if record.project_type else None
                ),
            },
            {
                "id": "planned_completion_date",
                "headerName": "Planned Completion Date",
                "type": "date",
            },
            {
                "id": "actual_completion_date",
                "headerName": "Actual Completion Date",
                "type": "date",
            },
            {
                "id": "status_name",
                "headerName": "Status",
                "method": lambda record: record.status.name if record.status else None,
            },
            {
                "id": "project_duration",
                "headerName": "Project Duration (months)",
            },
            {
                "id": "local_ownership",
                "headerName": "Local Ownership (%)",
            },
            {
                "id": "export_to_non_a5",
                "headerName": "Export to non-A5 (%)",
            },
            {
                "id": "revision_number",
                "headerName": "Revision Number",
            },
            {
                "id": "meeting_name",
                "headerName": "Meeting",
                "method": lambda record: (
                    record.meeting.number if record.meeting else None
                ),
            },
            {
                "id": "date_of_approval",
                "headerName": "Date of Approval",
            },
            {
                "id": "chemical_phased_out",
                "headerName": "Chemical Phased Out",
                "cell_format": "$###,###,##0.00#############",
                "align": "right",
            },
            {
                "id": "impact",
                "headerName": "Impact (ODP tonnes phased out)",
                "cell_format": "$###,###,##0.00#############",
                "align": "right",
            },
            {
                "id": "funds_approved",
                "headerName": "Funds Approved/Allocated (US $)",
                "cell_format": "$###,###,##0.00#############",
                "align": "right",
            },
            {
                "id": "capital_cost_approved",
                "headerName": "Capital Cost Approved/Allocated (US $)",
                "cell_format": "$###,###,##0.00#############",
                "align": "right",
            },
            {
                "id": "operating_cost_approved",
                "headerName": "Operating Cost Approved/Allocated (US $)",
                "cell_format": "$###,###,##0.00#############",
                "align": "right",
            },
            {
                "id": "cost_effectiveness_approved",
                "headerName": "Cost Effectiveness Approved (US $/kg)",
                "cell_format": "$###,###,##0.00#############",
                "align": "right",
            },
            {
                "id": "funds_disbursed",
                "headerName": "Funds Disbursed (US $)",
                "cell_format": "$###,###,##0.00#############",
                "align": "right",
            },
            {
                "id": "capital_cost_disbursed",
                "headerName": "Capital Cost Disbursed (US $)",
                "cell_format": "$###,###,##0.00#############",
                "align": "right",
            },
            {
                "id": "operating_cost_disbursed",
                "headerName": "Operating Cost Disbursed (US $)",
                "cell_format": "$###,###,##0.00#############",
                "align": "right",
            },
            {
                "id": "cost_effectiveness_actual",
                "headerName": "Cost Effectiveness Actual (US $/kg)",
                "cell_format": "$###,###,##0.00#############",
                "align": "right",
            },
            {
                "id": "co_financing_planned",
                "headerName": "Co-financing (Planned) (US $)",
            },
            {
                "id": "co_financing_actual",
                "headerName": "Co-financing (Actual) (US $)",
            },
            {
                "id": "funds_transferred",
                "headerName": "Funds Transferred (US $)",
                "cell_format": "$###,###,##0.00#############",
                "align": "right",
            },
            {
                "id": "agency_remarks",
                "headerName": "Agency Remarks",
            },
            {
                "id": "secretariat_remarks",
                "headerName": "Secretariat Remarks",
            },
            {
                "id": "excom_provision",
                "headerName": "ExCom Provision",
            },
            {
                "id": "date_of_report",
                "headerName": "Date of Report",
                "type": "date",
            },
            {
                "id": "date_of_revision",
                "headerName": "Date of Revision",
                "type": "date",
            },
        ]

        for i in range(4):
            headers.extend(self.ods_odp_headers(i + 1))
        sheet = wb.create_sheet("Enterprises")
        super().__init__(sheet, headers)

    def ods_odp_headers(self, idx):
        return [
            {
                "id": f"ods_odp__display_name_{idx}",
                "headerName": f"ODS ODP Display name {idx}",
                "method": lambda enterprise: self.ods_odp_at_idx(
                    enterprise,
                    idx - 1,
                    lambda ods_odp: ods_odp.display_name,
                ),
            },
            {
                "id": f"ods_odp__consumption_{idx}",
                "headerName": f"ODS ODP Consumption {idx}",
                "method": lambda enterprise: self.ods_odp_at_idx(
                    enterprise, idx - 1, lambda ods_odp: ods_odp.consumption
                ),
                "cell_format": "$###,###,##0.00#############",
                "align": "right",
            },
            {
                "id": f"ods_odp__selected_alternative_{idx}",
                "headerName": f"ODS ODP Selected Alternative {idx}",
                "method": lambda enterprise: self.ods_odp_at_idx(
                    enterprise, idx - 1, lambda ods_odp: ods_odp.selected_alternative
                ),
            },
            {
                "id": f"ods_odp__chemical_phased_in_mt_{idx}",
                "headerName": f"ODS ODP Chemical Phased In MT {idx}",
                "method": lambda enterprise: self.ods_odp_at_idx(
                    enterprise, idx - 1, lambda ods_odp: ods_odp.chemical_phased_in_mt
                ),
                "cell_format": "$###,###,##0.00#############",
                "align": "right",
            },
        ]

    def ods_odp_at_idx(self, enterprise, idx, func):
        ods_odps: list[EnterpriseOdsOdp] = list(enterprise.ods_odp.all())

        if len(ods_odps) > idx:
            ods_odp = ods_odps[idx]
            return func(ods_odp)

        return None

    def write_data(self, data):
        row_idx = self.header_row_end_idx + 1
        for record in data:
            self._write_record_row(row_idx, record)
            row_idx += 1

    def _write_record_row(self, row_idx, record):
        # write the record data

        for header_id, header in self.headers.items():
            method = header.get("method")
            header_type = header.get("type")
            if method:
                value = method(record)
            else:
                value = getattr(record, header_id, None)

            if header_type == "date" and value:
                value = value.strftime("%d.%m.%Y")

            self._write_record_cell(
                row_idx,
                header["column"],
                value,
                align=header.get("align", "left"),
            )
