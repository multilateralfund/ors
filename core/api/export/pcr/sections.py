"""
The data of an exported PCR, independent of the output format.

Each section of the PCR is built as a list of blocks (labelled fields or tables),
which are then laid out by the PDF, Word and Excel renderers. The sections follow
the client's PCR template (Annex II - Universal project completion report format).
"""

import math
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Any

from dateutil.relativedelta import relativedelta

from core.api.export.pcr.constants import SECTIONS
from core.models import MetaProject, Project
from core.models.project_completion_report import PCR, PCRGenderMainstreaming

NO_DATA_TEXT = "No data reported."

# Same labels as in the frontend (disposalTypeOptions)
DISPOSAL_TYPES = {
    1: "Disposal type 1",
    2: "Disposal type 2",
    3: "Disposal type 3",
}


@dataclass
class Amount:
    """A money value, always shown with 2 decimals"""

    value: Decimal


@dataclass
class Fields:
    """Labelled values, shown as a two column table"""

    items: list[tuple[str, Any]]
    title: str = ""


@dataclass
class Table:
    headers: list[str]
    rows: list[list[Any]]
    title: str = ""


@dataclass
class Section:
    key: str
    number: int
    title: str
    blocks: list[Fields | Table] = field(default_factory=list)


@dataclass
class PCRDocument:
    """All the exported data of a PCR"""

    title: str
    metacode: str
    country: str
    lead_agency: str
    identification: Fields
    sections: list[Section]


def months_between(start: date | None, end: date | None) -> int | None:
    """
    Duration in months, rounded up, as computed in the frontend (dayjs month diff).
    """
    if not start or not end:
        return None
    whole_months = (end.year - start.year) * 12 + end.month - start.month
    anchor = start + relativedelta(months=whole_months)
    if end < anchor:
        other_anchor = start + relativedelta(months=whole_months - 1)
        fraction = (end - anchor).days / (anchor - other_anchor).days
    else:
        other_anchor = start + relativedelta(months=whole_months + 1)
        fraction = (end - anchor).days / (other_anchor - anchor).days
    return max(math.ceil(whole_months + fraction), 0)


def _name(obj):
    return obj.name if obj else None


def _project_funds_approved(project) -> Decimal:
    # Imported here: when the inventory report module is the first one imported,
    # there is a circular import between the API serializers and views
    # pylint: disable-next=import-outside-toplevel
    from core.api.export.projects_inventory_report import project_actual_fund

    return Decimal(project_actual_fund(project))


def _project_actual_completion(project) -> date | None:
    # pylint: disable-next=import-outside-toplevel
    from core.api.export.projects_inventory_report import project_apr_date_completed

    return project_apr_date_completed(project)


class PCRDocumentBuilder:
    """
    Builds the exported data of a PCR. The PCR must be fetched with
    `export_pcr_queryset` and `projects` are the meta project's projects visible
    to the user (as in the PCR view), with the endorsed APRs prefetched.
    """

    def __init__(self, pcr: PCR, projects: list[Project]):
        self.pcr = pcr
        self.meta_project: MetaProject = pcr.meta_project
        self.projects = projects
        self.pcr_projects = {
            pcr_project.project_id: pcr_project
            for pcr_project in pcr.pcr_projects.all()
        }
        # The lead agency first, then the agencies of the projects (as in the view)
        agencies = [self.meta_project.lead_agency] + [
            project.agency for project in projects
        ]
        self.agency_order = {}
        for agency in agencies:
            if agency and agency.id not in self.agency_order:
                self.agency_order[agency.id] = len(self.agency_order)

    def _by_agency(self, entries):
        return sorted(
            entries,
            key=lambda entry: (
                self.agency_order.get(entry.agency_id, len(self.agency_order)),
                entry.agency.name,
                entry.id,
            ),
        )

    def build(self, section_keys) -> PCRDocument:
        builders = {
            "overview": self.build_overview,
            "project_results": self.build_project_results,
            "causes_of_delay": self.build_causes_of_delay,
            "lessons_learned": self.build_lessons_learned,
            "gender_mainstreaming": self.build_gender_mainstreaming,
            "sdgs": self.build_sdgs,
            "summary_of_key_data": self.build_summary_of_key_data,
            "supporting_evidence": self.build_supporting_evidence,
        }
        sections = []
        for number, (key, title) in enumerate(SECTIONS, start=1):
            if key in section_keys:
                sections.append(Section(key, number, title, builders[key]()))

        meta_project = self.meta_project
        return PCRDocument(
            title=f"Project completion report - {meta_project.umbrella_code}",
            metacode=meta_project.umbrella_code,
            country=_name(meta_project.country),
            lead_agency=_name(meta_project.lead_agency),
            identification=self.build_identification(),
            sections=sections,
        )

    # Identification, always exported

    def _cooperating_agencies(self):
        lead_agency_id = self.meta_project.lead_agency_id
        return sorted(
            {
                project.agency.name
                for project in self.projects
                if project.agency and project.agency_id != lead_agency_id
            }
        )

    def build_identification(self):
        pcr = self.pcr
        items = [
            ("Metacode", self.meta_project.umbrella_code),
        ]
        if self.meta_project.type == MetaProject.MetaProjectType.IND and self.projects:
            items.append(("Title", self.projects[0].title))
        items += [
            ("Country", _name(self.meta_project.country)),
            ("Lead agency", _name(self.meta_project.lead_agency)),
            ("Cooperating agency(ies)", ", ".join(self._cooperating_agencies())),
            ("PCR status", pcr.status),
            ("Submission date", pcr.submission_date),
            ("Revised submission date", pcr.revised_submission_date),
            ("Endorsement date", pcr.approval_date),
        ]
        return Fields(items)

    # Section 1

    def _funding_table(self):
        approved = {}
        disbursed = {}
        for project in self.projects:
            if not project.agency_id:
                continue
            approved[project.agency_id] = approved.get(
                project.agency_id, 0
            ) + _project_funds_approved(project)
            pcr_project = self.pcr_projects.get(project.id)
            if pcr_project and pcr_project.funds_disbursed:
                disbursed[project.agency_id] = (
                    disbursed.get(project.agency_id, 0) + pcr_project.funds_disbursed
                )

        agencies = {project.agency_id: project.agency for project in self.projects}
        rows = []
        for agency_id in sorted(approved, key=self.agency_order.get):
            role = (
                "Lead agency"
                if agency_id == self.meta_project.lead_agency_id
                else "Cooperating agency"
            )
            agency_approved = approved[agency_id]
            agency_disbursed = disbursed.get(agency_id, 0)
            rows.append(
                [
                    f"{agencies[agency_id].name} ({role})",
                    Amount(agency_approved),
                    Amount(agency_disbursed),
                    Amount(agency_approved - agency_disbursed),
                ]
            )
        total_approved = sum(approved.values(), Decimal(0))
        total_disbursed = sum(disbursed.values(), Decimal(0))
        rows.append(
            [
                "Total MLF funding",
                Amount(total_approved),
                Amount(total_disbursed),
                Amount(total_approved - total_disbursed),
            ]
        )
        return Table(
            ["Agency", "Approved", "Disbursed", "Returned"],
            rows,
            title="Multilateral Fund (MLF) funding (US$)",
        )

    def _impact_indicators_table(self):
        # Always added, even if empty, as the Excel export matches the blocks of
        # the PCRs by their position in the section
        return Table(
            ["Indicator", "Actual value"],
            [
                [indicator["label"], indicator.get("value")]
                for indicator in self.pcr.impact_indicators or []
            ],
            title="Impact indicators",
        )

    def build_overview(self):
        pcr = self.pcr
        return [
            Fields(
                [
                    ("Country", _name(self.meta_project.country)),
                    ("Metacode", self.meta_project.umbrella_code),
                    (
                        "Relevant decision(s)",
                        ", ".join(decision.title for decision in pcr.decisions.all()),
                    ),
                    (
                        "Address(es) of enterprise(s) and project site(s), "
                        "if applicable",
                        pcr.addresses,
                    ),
                    ("Date of approval of the project", pcr.project_date_approved),
                    ("Date of completion of the project", pcr.project_date_completion),
                    ("ODP phase-out (Approved)", pcr.phase_out_ods_approved),
                    ("ODP phase-out (Actual)", pcr.phase_out_ods_actual),
                    (
                        "HFCs phased down (CO2 eq-tonnes) (Approved)",
                        pcr.phase_out_co2_eq_t_approved,
                    ),
                    (
                        "HFCs phased down (CO2 eq-tonnes) (Actual)",
                        pcr.phase_out_co2_eq_t_actual,
                    ),
                ],
                title="Project overview",
            ),
            self._impact_indicators_table(),
            self._funding_table(),
            Fields(
                [
                    ("Financial figures status", pcr.financial_figures_status),
                    (
                        "Financial figures - explanations, if needed",
                        pcr.financial_figures_status_explanation,
                    ),
                    ("All project goals achieved", pcr.project_goal_achieved),
                    (
                        "If no, please provide a brief explanation",
                        pcr.project_goal_achieved_explanation,
                    ),
                    ("Completion report done by", pcr.completed_by),
                ],
            ),
        ]

    # Section 2

    def build_project_results(self):
        pcr = self.pcr
        rating_items = [("Overall rating", pcr.rating)]
        if pcr.rating == PCR.Rating.OTHER:
            rating_items.append(("Specify rating", pcr.rating_explanation_other))
        rating_items.append(("Please explain your rating", pcr.rating_explanation))
        return [
            Table(
                [
                    "Agency",
                    "Activity title",
                    "Planned output(s)",
                    "Actual output(s)",
                    "Additional remarks, if applicable",
                ],
                [
                    [
                        highlight.agency.name,
                        highlight.activity_title,
                        highlight.planned_output,
                        highlight.actual_activity_output,
                        highlight.additional_remarks,
                    ]
                    for highlight in self._by_agency(
                        pcr.overall_assessment_highlights.all()
                    )
                ],
                title="Implementation effectiveness (achievement of activity output)",
            ),
            Fields(
                rating_items,
                title="Overall assessment (achievement of project objective)",
            ),
            Table(
                ["Entity", "Comment"],
                [
                    [comment.entity, comment.comment]
                    for comment in pcr.additional_comments.all()
                ],
                title="Comments",
            ),
        ]

    # Section 3

    def build_causes_of_delay(self):
        rows = []
        for delay_cause in self._by_agency(self.pcr.delay_causes.all()):
            root_causes = delay_cause.pcrdelaycauserootcause_set.all()
            for root_cause in root_causes or [None]:
                rows.append(
                    [
                        delay_cause.agency.name,
                        _name(delay_cause.delay_cluster),
                        _name(root_cause.root_cause) if root_cause else None,
                        (
                            root_cause.description_roots_causes_of_delay
                            if root_cause
                            else None
                        ),
                        root_cause.action_taken if root_cause else None,
                    ]
                )
        return [
            Table(
                [
                    "Agency",
                    "Cause of delay",
                    "Root cause",
                    "Description of cause of delay",
                    "Action taken",
                ],
                rows,
            )
        ]

    # Section 4

    def build_lessons_learned(self):
        rows = []
        for learned_lesson in self._by_agency(self.pcr.learned_lessons.all()):
            for description in learned_lesson.pcrlearnedlessondescription_set.all():
                rows.append(
                    [
                        learned_lesson.agency.name,
                        _name(description.lesson),
                        description.description,
                    ]
                )
        return [
            Table(["Agency", "Lesson learned", "Description"], rows),
            Table(
                ["Agency", "Recommendation", "Description"],
                [
                    [
                        recommendation.agency.name,
                        recommendation.title,
                        recommendation.description,
                    ]
                    for recommendation in self._by_agency(
                        self.pcr.future_project_recommendations.all()
                    )
                ],
                title="Recommendations for future project design and implementation",
            ),
        ]

    # Section 5

    def build_gender_mainstreaming(self):
        phases = list(PCRGenderMainstreaming.ProjectPreparation)
        entries = sorted(
            self.pcr.gender_mainstreamings.all(),
            key=lambda entry: (
                self.agency_order.get(entry.agency_id, len(self.agency_order)),
                entry.agency.name,
                (
                    phases.index(entry.project_preparation)
                    if entry.project_preparation in phases
                    else len(phases)
                ),
            ),
        )
        return [
            Table(
                [
                    "Agency",
                    "Project cycle phase",
                    "Gender policy implemented",
                    "Qualitative description",
                ],
                [
                    [
                        entry.agency.name,
                        entry.project_preparation,
                        entry.prefilled,
                        entry.qualitative_description,
                    ]
                    for entry in entries
                ],
            )
        ]

    # Section 6

    def build_sdgs(self):
        rows = []
        for sdg in self._by_agency(self.pcr.sustainable_development_goals.all()):
            if not sdg.sdg_applying:
                rows.append(
                    [sdg.agency.name, "No", None, sdg.sdg_not_applying_explanation]
                )
                continue
            goals = sdg.pcrsustainabledevelopmentgoaldescription_set.all()
            for goal in goals or [None]:
                rows.append(
                    [
                        sdg.agency.name,
                        "Yes",
                        _name(goal.goal) if goal else None,
                        goal.description if goal else None,
                    ]
                )
        return [
            Table(
                [
                    "Agency",
                    "Contributed to SDGs",
                    "SDG",
                    "Description of contribution / explanation",
                ],
                rows,
            )
        ]

    # Section 7

    def build_summary_of_key_data(self):
        projects_rows = []
        alternative_technologies = []
        enterprises = []
        equipments = []
        for project in self.projects:
            pcr_project = self.pcr_projects.get(project.id)
            planned_completion = (
                pcr_project.planned_date_of_completion if pcr_project else None
            )
            actual_completion = _project_actual_completion(project)
            planned_duration = months_between(project.date_approved, planned_completion)
            actual_duration = months_between(project.date_approved, actual_completion)
            delay = (
                actual_duration - planned_duration
                if planned_duration is not None and actual_duration is not None
                else None
            )
            funds_disbursed = pcr_project.funds_disbursed if pcr_project else None
            projects_rows.append(
                [
                    _name(project.agency),
                    project.code,
                    _name(project.sector),
                    project.tranche,
                    project.date_approved,
                    planned_completion,
                    actual_completion,
                    Amount(_project_funds_approved(project)),
                    Amount(funds_disbursed) if funds_disbursed is not None else None,
                    planned_duration,
                    actual_duration,
                    delay,
                ]
            )
            if not pcr_project:
                continue
            for technology in pcr_project.alternative_technologies.all():
                alternative_technologies.append(
                    [
                        project.code,
                        _name(technology.substance_from),
                        _name(technology.substance_to),
                    ]
                )
            for enterprise in pcr_project.enterprises.all():
                enterprises.append([project.code, enterprise.name, enterprise.address])
            for equipment in pcr_project.equipments.all():
                equipments.append(
                    [
                        project.code,
                        equipment.name,
                        equipment.description,
                        DISPOSAL_TYPES.get(equipment.disposal_type),
                        equipment.disposal_date,
                    ]
                )

        return [
            Table(
                [
                    "Agency",
                    "Project number",
                    "Sector",
                    "Tranche(s)",
                    "Date approved",
                    "Planned date of completion",
                    "Actual date of completion",
                    "Funds approved",
                    "Funds disbursed",
                    "Planned duration (months)",
                    "Actual duration (months)",
                    "Delay (months)",
                ],
                projects_rows,
            ),
            Table(
                [
                    "Project number",
                    "Substance converted from",
                    "Substance converted to",
                ],
                alternative_technologies,
                title="Conversion / alternative technology used",
            ),
            Table(
                ["Project number", "Name of enterprise", "Address of enterprise"],
                enterprises,
                title="Enterprises",
            ),
            Table(
                [
                    "Project number",
                    "Name of equipment",
                    "Description",
                    "Disposal type",
                    "Date of disposal",
                ],
                equipments,
                title="Fate of ODS-based production equipment - "
                "list of equipment rendered unusable (baseline)",
            ),
        ]

    # Section 8

    def build_supporting_evidence(self):
        return [
            Table(
                ["Agency", "Section", "File name", "Link"],
                [
                    [
                        evidence.agency.name,
                        _name(evidence.section),
                        evidence.filename,
                        evidence.link,
                    ]
                    for evidence in self._by_agency(self.pcr.supporting_evidences.all())
                ],
            )
        ]


def format_value(value) -> str:  # pylint: disable=too-many-return-statements
    """Text shown for a value in the PDF and Word documents"""
    if value is None or value == "":
        return "-"
    if isinstance(value, Amount):
        return f"{value.value:,.2f}"
    if isinstance(value, bool):
        return "Yes" if value else "No"
    if isinstance(value, int):
        return f"{value:,}"
    if isinstance(value, (Decimal, float)):
        # without the trailing zeros of the decimal fields
        return format(Decimal(str(value)).normalize(), ",f")
    if isinstance(value, date):
        return value.strftime("%d/%m/%Y")
    return str(value)
