from functools import partial

from core.api.export.base import BaseWriter
from core.api.export.projects_v2_dump import get_value_fk


def get_project_version(project, version):
    if project.version == version:
        return project

    prefetched_versions = getattr(project, "_prefetched_objects_cache", {}).get(
        "archive_projects"
    )
    if prefetched_versions is not None:
        for archived_project in prefetched_versions:
            if archived_project.version == version:
                return archived_project
        return None

    return project.get_version(version)


def calc_total_fund(project, version):
    versioned_project = get_project_version(project, version)
    prev_version = get_project_version(project, version - 1)
    if not versioned_project or not prev_version:
        return None

    return (versioned_project.total_fund or 0) - (prev_version.total_fund or 0)


def calc_support_cost_psc(project, version):
    versioned_project = get_project_version(project, version)
    prev_version = get_project_version(project, version - 1)
    if not versioned_project or not prev_version:
        return None

    return (versioned_project.support_cost_psc or 0) - (
        prev_version.support_cost_psc or 0
    )


def funding_headers(version):
    if version < 4:
        return []

    idx = version - 3

    def validate_project(project):
        versioned_project = get_project_version(project, version)
        return (
            version >= 4
            and versioned_project is not None
            and versioned_project.adjustment is False
            and versioned_project.transferred_from is None
        )

    return [
        {
            "id": f"funds_approved_v{version}",
            "headerName": f"Project funding meeting {idx}",
            "method": lambda project, _: (
                calc_total_fund(project, version) if validate_project(project) else None
            ),
            "type": "number",
            "align": "right",
        },
        {
            "id": f"psc_v{version}",
            "headerName": f"PSC meeting {idx}",
            "method": lambda project, _: (
                calc_support_cost_psc(project, version)
                if validate_project(project)
                else None
            ),
            "type": "number",
            "align": "right",
        },
        {
            "id": f"post_excom_meeting_v{version}",
            "headerName": f"Meeting Approved {idx}",
            "method": lambda project, _: (
                (
                    get_project_version(project, version).post_excom_meeting
                    and get_project_version(project, version).post_excom_meeting.number
                    or (
                        get_project_version(project, version).meeting
                        and get_project_version(project, version).meeting.number
                    )
                )
                if validate_project(project)
                else None
            ),
        },
        {
            "id": f"date_approved_v{version}",
            "headerName": f"Date Approved {idx}",
            "type": "date",
            "method": lambda project, _: (
                get_project_version(project, version).date_approved
                if validate_project(project)
                else None
            ),
        },
    ]


def adjustment_headers(version):
    if version < 4:
        return []

    idx = version - 3

    def validate_project(project):
        versioned_project = get_project_version(project, version)
        return (
            version >= 4
            and versioned_project is not None
            and (
                versioned_project.adjustment is True
                or versioned_project.transferred_from_id is not None
            )
        )

    return [
        {
            "id": f"funds_adjustment_v{version}",
            "headerName": f"Fund Adjustments {idx}",
            "method": lambda project, _: (
                calc_total_fund(project, version) if validate_project(project) else None
            ),
            "type": "number",
            "align": "right",
        },
        {
            "id": f"psc_adjustment_v{version}",
            "headerName": f"Support Cost Adjustments {idx}",
            "method": lambda project, _: (
                calc_support_cost_psc(project, version)
                if validate_project(project)
                else None
            ),
            "type": "number",
            "align": "right",
        },
        {
            "id": f"adjustment_meeting_v{version}",
            "headerName": f"Adjustments Meeting {idx}",
            "method": lambda project, _: (
                (
                    get_project_version(project, version).post_excom_meeting
                    and get_project_version(project, version).post_excom_meeting.number
                    or (
                        get_project_version(project, version).meeting
                        and get_project_version(project, version).meeting.number
                    )
                )
                if validate_project(project)
                else None
            ),
        },
        {
            "id": f"adjustment_date_v{version}",
            "headerName": f"Adjustments Date {idx}",
            "type": "date",
            "method": lambda project, _: (
                get_project_version(project, version).date_approved
                if validate_project(project)
                else None
            ),
        },
    ]


class ProjectsInventoryReportWriter(BaseWriter):
    ROW_HEIGHT = 35
    COLUMN_WIDTH = 20
    header_row_start_idx = 1

    def __init__(self, sheet):
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
                "method": lambda project, _: project.funding_window_id,
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
            headers.extend(funding_headers(i + 4))

        for i in range(7):
            headers.extend(adjustment_headers(i + 4))

        super().__init__(sheet, headers)
