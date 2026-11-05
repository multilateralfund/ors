from django.db.models import F

from core.models.project_completion_report import (
    PCR,
    PCRDelayCause,
    PCRLearnedLessonDescription,
    PCRProject,
    PCRSustainableDevelopmentGoal,
)

SUBMIT_REQUIRED_MESSAGE = "This field is required for submission."

OVERVIEW_REQUIRED_FIELDS = [
    "financial_figures_status",
    "financial_figures_status_explanation",
    "addresses",
    "project_goal_achieved",
    "project_goal_achieved_explanation",
    "rating",
    "rating_explanation",
    "completed_by",
]

PCR_PROJECT_REQUIRED_FIELDS = ["funds_disbursed", "planned_date_of_completion"]

PCR_PROJECT_ROWS_REQUIRED_FIELDS = {
    "alternative_technologies": ["substance_from_id", "substance_to_id"],
    "enterprises": ["name", "address"],
    "equipments": ["name", "description", "disposal_type", "disposal_date"],
}

# The PCR form tab of each section, used in the error summary
SECTION_TITLES = {
    "additional_comments": "Overview",
    "pcr_projects": "Summary of key data",
    "overall_assessment_highlights": "Project results",
    "delay_causes": "Causes of delay",
    "learned_lessons": "Lessons learned",
    "future_project_recommendations": "Lessons learned",
    "gender_mainstreamings": "Gender mainstreaming",
    "sustainable_development_goals": "SDGs",
    "supporting_evidences": "Other supporting evidence",
}


def _is_empty(value):
    if isinstance(value, str):
        return not value.strip()
    return value is None


def _get_missing_fields(obj, fields):
    """
    The required field errors of one object, using the API names of the fields
    (e.g. "substance_from" instead of "substance_from_id").
    """
    return {
        field.removesuffix("_id"): [SUBMIT_REQUIRED_MESSAGE]
        for field in fields
        if _is_empty(getattr(obj, field))
    }


def _get_rows_errors(rows, fields, get_nested_errors=None):
    """
    The errors of a list of rows that should not be empty: either the required
    message, if there are no rows, or the errors of each invalid row by its id.
    """
    if not rows:
        return [SUBMIT_REQUIRED_MESSAGE]
    rows_errors = {}
    for row in rows:
        row_errors = _get_missing_fields(row, fields)
        if get_nested_errors:
            row_errors.update(get_nested_errors(row))
        if row_errors:
            rows_errors[row.id] = row_errors
    return rows_errors


def _get_agencies_rows_errors(agency_ids, rows, fields, get_nested_errors=None):
    """
    The errors of a section filled per agency, by agency id. Each agency should
    have at least one row.
    """
    errors = {}
    for agency_id in agency_ids:
        agency_rows = [row for row in rows if row.agency_id == agency_id]
        agency_errors = _get_rows_errors(agency_rows, fields, get_nested_errors)
        if agency_errors:
            errors[agency_id] = agency_errors
    return errors


def _get_pcr_agency_ids(pcr, pcr_projects):
    """
    The lead agency of the meta project and the agencies of all the PCR projects.
    """
    agency_ids = [pcr.meta_project.lead_agency_id]
    agency_ids.extend(pcr_project.project.agency_id for pcr_project in pcr_projects)
    return list(dict.fromkeys(agency_id for agency_id in agency_ids if agency_id))


def _get_overview_errors(pcr):
    required_fields = list(OVERVIEW_REQUIRED_FIELDS)
    if pcr.rating == PCR.Rating.OTHER:
        required_fields.append("rating_explanation_other")
    errors = _get_missing_fields(pcr, required_fields)

    comments_errors = _get_rows_errors(
        list(pcr.additional_comments.all()), ["entity", "comment"]
    )
    if comments_errors:
        errors["additional_comments"] = comments_errors
    return errors


def _get_pcr_projects_errors(pcr_projects):
    errors = {}
    for pcr_project in pcr_projects:
        project_errors = _get_missing_fields(pcr_project, PCR_PROJECT_REQUIRED_FIELDS)
        for field, row_fields in PCR_PROJECT_ROWS_REQUIRED_FIELDS.items():
            rows_errors = _get_rows_errors(
                list(getattr(pcr_project, field).all()), row_fields
            )
            if rows_errors:
                project_errors[field] = rows_errors
        if project_errors:
            errors[pcr_project.project_id] = project_errors
    return errors


def _get_delay_cause_errors(delay_cause):
    root_causes_errors = _get_rows_errors(
        list(delay_cause.pcrdelaycauserootcause_set.all()),
        ["description_roots_causes_of_delay", "action_taken"],
    )
    return {"root_causes_of_delay": root_causes_errors} if root_causes_errors else {}


def _get_sdgs_errors(agency_ids, sdgs):
    sdgs_by_agency = {sdg.agency_id: sdg for sdg in sdgs}
    errors = {}
    for agency_id in agency_ids:
        sdg = sdgs_by_agency.get(agency_id)
        if sdg is not None and not sdg.sdg_applying:
            agency_errors = _get_missing_fields(sdg, ["sdg_not_applying_explanation"])
        else:
            # No SDG row means the agency did not select any goal yet
            goals = (
                list(sdg.pcrsustainabledevelopmentgoaldescription_set.all())
                if sdg
                else []
            )
            goals_errors = _get_rows_errors(goals, ["description"])
            agency_errors = {"goals": goals_errors} if goals_errors else {}
        if agency_errors:
            errors[agency_id] = agency_errors
    return errors


def get_pcr_submission_errors(pcr):
    """
    Check that a PCR has all the data required for submit and approve, the same
    checks as the PCR form. The data can be saved incomplete while the PCR is a draft.

    Returns the errors by API field name, empty if the PCR is valid:
    - PCR fields: a list with the required message
    - lists that should not be empty: a list with the required message if empty,
      otherwise the errors of the invalid rows by row id
    - sections filled per agency: the errors of each invalid agency by agency id
    - `pcr_projects`: the errors of each invalid PCR project by project id
    """
    pcr_projects = list(
        PCRProject.objects.filter(pcr=pcr)
        .select_related("project")
        .prefetch_related("alternative_technologies", "enterprises", "equipments")
    )
    agency_ids = _get_pcr_agency_ids(pcr, pcr_projects)

    errors = _get_overview_errors(pcr)
    sections_errors = {
        "pcr_projects": _get_pcr_projects_errors(pcr_projects),
        "overall_assessment_highlights": _get_agencies_rows_errors(
            agency_ids,
            list(pcr.overall_assessment_highlights.all()),
            [
                "activity_title",
                "planned_output",
                "actual_activity_output",
                "additional_remarks",
            ],
        ),
        "delay_causes": _get_agencies_rows_errors(
            agency_ids,
            list(
                PCRDelayCause.objects.filter(pcr=pcr).prefetch_related(
                    "pcrdelaycauserootcause_set"
                )
            ),
            [],
            _get_delay_cause_errors,
        ),
        # The lessons are grouped in one learned lesson row per agency
        "learned_lessons": _get_agencies_rows_errors(
            agency_ids,
            list(
                PCRLearnedLessonDescription.objects.filter(
                    learned_lesson__pcr=pcr
                ).annotate(agency_id=F("learned_lesson__agency_id"))
            ),
            ["description"],
        ),
        "future_project_recommendations": _get_agencies_rows_errors(
            agency_ids,
            list(pcr.future_project_recommendations.all()),
            ["title", "description"],
        ),
        "gender_mainstreamings": _get_agencies_rows_errors(
            agency_ids,
            list(pcr.gender_mainstreamings.all()),
            ["project_preparation", "prefilled", "qualitative_description"],
        ),
        "sustainable_development_goals": _get_sdgs_errors(
            agency_ids,
            PCRSustainableDevelopmentGoal.objects.filter(pcr=pcr).prefetch_related(
                "pcrsustainabledevelopmentgoaldescription_set"
            ),
        ),
        "supporting_evidences": _get_agencies_rows_errors(
            agency_ids, list(pcr.supporting_evidences.all()), []
        ),
    }
    errors.update({field: value for field, value in sections_errors.items() if value})
    return errors


def get_pcr_submission_error_message(errors, action):
    sections = []
    for field in errors:
        section = SECTION_TITLES.get(field, "Overview")
        if section not in sections:
            sections.append(section)
    return (
        f"PCR cannot be {action}, required data is missing in: {', '.join(sections)}."
    )
