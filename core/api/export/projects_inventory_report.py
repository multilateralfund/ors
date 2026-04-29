from functools import partial

from core.api.export.base import BaseWriter
from core.api.export.projects_v2_dump import get_value_fk
from core.models import Project


def trf_or_adj(project):
    return project.status.name == "Transferred" or project.adjustment == True


def not_trf_or_adj(project):
    return project.status.name != "Transferred" and project.adjustment == False


class ProjectsInventoryReportWriter(BaseWriter):
    ROW_HEIGHT = 35
    COLUMN_WIDTH = 20
    header_row_start_idx = 1

    def __init__(self, sheet, version_map):
        self.version_map = version_map
        self.all_versions: dict[int, list[Project]] = {}

        for (final_version_id, _), p in self.version_map.items():
            if p.id != final_version_id:
                self.all_versions.setdefault(final_version_id, []).append(p)

        headers = [
            {"id": "id", "headerName": "id", "method": lambda project, _: project.id},
            {
                "id": "country",
                "headerName": "Country",
                "method": partial(get_value_fk, None),
            },
            {
                "id": "metacode",
                "headerName": "Metacode",
                "method": lambda project, _: project.metacode,
            },
            {
                "id": "code",
                "headerName": "Code",
                "column_width": self.COLUMN_WIDTH * 2,
                "method": lambda project, _: project.code,
            },
            {
                "id": "code_legacy",
                "headerName": "Legacy code",
                "column_width": self.COLUMN_WIDTH * 2,
                "method": lambda project, _: project.legacy_code,
            },
            {
                "id": "agency",
                "headerName": "Agency",
                "method": partial(get_value_fk, None),
            },
            {
                "id": "lead_agency",
                "headerName": "Lead agency",
                "method": partial(get_value_fk, None),
            },
            {
                "id": "cluster",
                "headerName": "Cluster",
                "column_width": self.COLUMN_WIDTH * 2,
                "method": partial(get_value_fk, None),
            },
            {
                "id": "project_type",
                "headerName": "Type",
                "method": partial(get_value_fk, None, attr_name="code"),
            },
            {
                "id": "sector",
                "headerName": "Sector",
                "column_width": self.COLUMN_WIDTH * 1.5,
                "method": partial(get_value_fk, None),
            },
            {
                "id": "sector_legacy",
                "headerName": "Sector legacy",
                "method": lambda project, _: project.sector_legacy,
            },
            {
                "id": "subsectors_list",
                "headerName": "Sub-sector(s)",
                "column_width": self.COLUMN_WIDTH * 1.5,
                "method": lambda project, _: ", ".join(
                    subsector.name for subsector in project.subsectors.all()
                ),
            },
            {
                "id": "subsector_legacy",
                "headerName": "Subsector legacy",
                "method": lambda project, _: project.subsector_legacy,
            },
            {
                "id": "title",
                "headerName": "Title",
                "column_width": self.COLUMN_WIDTH * 5,
                "method": lambda project, _: project.title,
            },
            {
                "id": "description",
                "headerName": "Description",
                "column_width": self.COLUMN_WIDTH * 5,
                "method": lambda project, _: project.description,
            },
            {
                "id": "excom_provision",
                "headerName": "Executive Committee provision",
                "column_width": self.COLUMN_WIDTH * 5,
                "method": lambda project, _: project.excom_provision,
            },
            {
                "id": "products_manufactured",
                "headerName": "Product manufactured",
                "column_width": self.COLUMN_WIDTH * 3,
                "method": lambda project, _: project.products_manufactured,
            },
            {
                "id": "tranche",
                "headerName": "Tranche number",
                "method": lambda project, _: project.tranche,
            },
            {
                "id": "metaproject_category",
                "headerName": "Category",
                "method": lambda project, _: (
                    project.meta_project.type if project.meta_project else ""
                ),
            },
            {
                "id": "funding_window",
                "headerName": "Funding window",
                "method": lambda project, _: (
                    project.funding_window.meeting.number
                    if project.funding_window
                    else ""
                ),
            },
            {
                "id": "production",
                "headerName": "Production",
                "type": "bool",
                "method": lambda project, _: project.production,
            },
            {
                "id": "bp_activity",
                "headerName": "Business plan activity",
                "method": lambda project, _: (
                    project.bp_activity.get_display_internal_id
                    if project.bp_activity
                    else ""
                ),
            },
            {
                "id": "additional_funding",
                "headerName": "Additional funding",
                "type": "bool",
                "method": lambda project, _: project.additional_funding,
            },
        ]

        for i in range(3):
            headers.extend(self.funding_headers(i + 4))

        for i in range(7):
            headers.extend(self.adjustment_headers(i + 4))

        headers.extend(
            [
                {
                    "id": "fund_transferred",
                    "headerName": "Fund transferred",
                    "method": lambda project, _: self.calc_sum_total_fund(project),
                },
                {
                    "id": "psc_transferred",
                    "headerName": "PSC transferred",
                    "method": lambda project, _: self.calc_sum_support_cost_psc(
                        project
                    ),
                },
                {
                    "id": "actual_fund",
                    "headerName": "Actual funds",
                    "method": lambda project, _: p.total_fund or 0,
                },
                {
                    "id": "actual_psc",
                    "headerName": "Actual PSC",
                    "method": lambda project, _: p.support_cost_psc or 0,
                },
                {
                    "id": "interest",
                    "headerName": "Interest",
                    "method": lambda project, _: p.support_cost_psc or 0,
                },
            ]
        )

        super().__init__(sheet, headers)

    def get_version(self, p, version):
        key = (p.final_version.id, version)
        return self.version_map.get(key)

    def get_all_previous_versions(self, p):
        return self.all_versions.get(p.id, ())

    def calc_total_fund(self, project):
        prev_version = self.get_version(project, project.version - 1)
        if prev_version:
            return (project.total_fund or 0) - (prev_version.total_fund or 0)
        return 0

    def calc_support_cost_psc(self, project):
        prev_version = self.get_version(project, project.version - 1)
        if prev_version:
            return (project.support_cost_psc or 0) - (
                prev_version.support_cost_psc or 0
            )
        return 0

    def calc_sum_total_fund(self, project):
        prev_versions = self.get_all_previous_versions(project)
        candidate_values = [
            (p.total_fund or 0) + (p.fund_transferred or 0)
            for p in prev_versions
            if trf_or_adj(p)
        ]
        return sum(candidate_values)

    def calc_sum_support_cost_psc(self, project):
        prev_versions = self.get_all_previous_versions(project)
        candidate_values = [
            (p.support_cost_psc or 0) + (p.psc_transferred or 0)
            for p in prev_versions
            if trf_or_adj(p)
        ]
        return sum(candidate_values)

    def calc_sum_interest(self, project):
        prev_versions = self.get_all_previous_versions(project)
        candidate_values = [p.interest or 0 for p in prev_versions]
        return sum(candidate_values)

    def funding_headers(self, version):
        if version < 4:
            return []

        idx = version - 3

        return [
            {
                "id": f"funds_approved_v{version}",
                "headerName": f"Project funding meeting {idx}",
                "method": lambda project, _: (
                    self.calc_total_fund(project) if not_trf_or_adj(project) else None
                ),
                "type": "number",
                "align": "right",
            },
            {
                "id": f"psc_v{version}",
                "headerName": f"PSC meeting {idx}",
                "method": lambda project, _: (
                    self.calc_support_cost_psc(project)
                    if not_trf_or_adj(project)
                    else None
                ),
                "type": "number",
                "align": "right",
            },
            {
                "id": f"post_excom_meeting_v{version}",
                "headerName": f"Meeting Approved {idx}",
                "method": lambda project, _: (
                    project.post_excom_meeting.number
                    if not_trf_or_adj(project) and project.post_excom_meeting
                    else None
                ),
            },
            {
                "id": f"date_approved_v{version}",
                "headerName": f"Date Approved {idx}",
                "type": "date",
                "method": lambda project, _: (
                    project.date_approved if not_trf_or_adj(project) else None
                ),
            },
        ]

    def adjustment_headers(self, version):
        if version < 4:
            return []

        idx = version - 3

        return [
            {
                "id": f"funds_adjustment_v{version}",
                "headerName": f"Fund Adjustments {idx}",
                "method": lambda project, _: (
                    self.calc_total_fund(project) if trf_or_adj(project) else None
                ),
                "type": "number",
                "align": "right",
            },
            {
                "id": f"psc_adjustment_v{version}",
                "headerName": f"Support Cost Adjustments {idx}",
                "method": lambda project, _: (
                    self.calc_support_cost_psc(project) if trf_or_adj(project) else None
                ),
                "type": "number",
                "align": "right",
            },
            {
                "id": f"adjustment_meeting_v{version}",
                "headerName": f"Adjustments Meeting {idx}",
                "method": lambda project, _: (
                    project.post_excom_meeting.number
                    if trf_or_adj(project) and project.post_excom_meeting
                    else None
                ),
            },
            {
                "id": f"adjustment_date_v{version}",
                "headerName": f"Adjustments Date {idx}",
                "type": "date",
                "method": lambda project, _: (
                    project.date_approved if trf_or_adj(project) else None
                ),
            },
        ]
