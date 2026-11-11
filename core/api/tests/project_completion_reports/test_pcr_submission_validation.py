import json

import pytest
from django.core.serializers.json import DjangoJSONEncoder
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.factories import AgencyFactory, MetaProjectFactory, ProjectFactory
from core.api.tests.project_completion_reports.utils import fill_pcr_required_data
from core.api.views.project_completion_report.pcr_validation import (
    SUBMIT_REQUIRED_MESSAGE,
    get_pcr_submission_errors,
)
from core.models.project_completion_report import (
    PCR,
    PCRAdditionalComment,
    PCRDelayCauseRootCause,
    PCRGenderMainstreaming,
    PCRLearnedLessonDescription,
    PCRProject,
    PCRProjectEquipment,
    PCRSustainableDevelopmentGoal,
    PCRSustainableDevelopmentGoalDescription,
)

# pylint: disable=unused-argument

pytestmark = pytest.mark.django_db

REQUIRED = [SUBMIT_REQUIRED_MESSAGE]


@pytest.fixture(name="client")
def _client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture(name="lead_agency")
def _lead_agency():
    return AgencyFactory.create()


@pytest.fixture(name="empty_pcr")
def _empty_pcr(lead_agency):
    meta_project = MetaProjectFactory.create(lead_agency=lead_agency)
    project = ProjectFactory.create(meta_project=meta_project, agency=lead_agency)
    pcr = PCR.objects.create(meta_project=meta_project)
    PCRProject.objects.create(pcr=pcr, project=project)
    return pcr


@pytest.fixture(name="pcr")
def _pcr(empty_pcr):
    return fill_pcr_required_data(empty_pcr)


def _action_url(pcr, action):
    return reverse(f"project-completion-report-{action}", args=[pcr.id])


def _set_state(pcr, version, status):
    PCR.objects.filter(pk=pcr.pk).update(version=version, status=status)
    pcr.refresh_from_db()


def test_complete_pcr_has_no_errors(pcr):
    assert get_pcr_submission_errors(pcr) == {}


def test_empty_pcr_errors(empty_pcr, lead_agency):
    project_id = empty_pcr.pcr_projects.get().project_id

    errors = get_pcr_submission_errors(empty_pcr)

    assert errors == {
        "financial_figures_status": REQUIRED,
        "financial_figures_status_explanation": REQUIRED,
        "addresses": REQUIRED,
        "project_goal_achieved": REQUIRED,
        "project_goal_achieved_explanation": REQUIRED,
        "rating": REQUIRED,
        "rating_explanation": REQUIRED,
        "completed_by": REQUIRED,
        "additional_comments": REQUIRED,
        "pcr_projects": {
            project_id: {
                "funds_disbursed": REQUIRED,
                "planned_date_of_completion": REQUIRED,
                "alternative_technologies": REQUIRED,
                "enterprises": REQUIRED,
                "equipments": REQUIRED,
            }
        },
        "overall_assessment_highlights": {lead_agency.id: REQUIRED},
        "delay_causes": {lead_agency.id: REQUIRED},
        "learned_lessons": {lead_agency.id: REQUIRED},
        "future_project_recommendations": {lead_agency.id: REQUIRED},
        "gender_mainstreamings": {lead_agency.id: REQUIRED},
        "sustainable_development_goals": {lead_agency.id: {"goals": REQUIRED}},
        "supporting_evidences": {lead_agency.id: REQUIRED},
    }


def test_rating_other_requires_explanation(pcr):
    PCR.objects.filter(pk=pcr.pk).update(rating=PCR.Rating.OTHER)
    pcr.refresh_from_db()

    assert get_pcr_submission_errors(pcr) == {"rating_explanation_other": REQUIRED}


def test_blank_text_is_missing(pcr):
    PCR.objects.filter(pk=pcr.pk).update(addresses="   ")
    comment = pcr.additional_comments.get()
    comment.comment = ""
    comment.save()
    pcr.refresh_from_db()

    assert get_pcr_submission_errors(pcr) == {
        "addresses": REQUIRED,
        "additional_comments": {comment.id: {"comment": REQUIRED}},
    }


def test_nested_rows_errors(pcr, lead_agency):
    pcr_project = pcr.pcr_projects.get()
    equipment = PCRProjectEquipment.objects.get(pcr_project=pcr_project)
    equipment.disposal_date = None
    equipment.save()
    root_cause = PCRDelayCauseRootCause.objects.get(delay_cause__pcr=pcr)
    root_cause.action_taken = ""
    root_cause.save()
    lesson = PCRLearnedLessonDescription.objects.get(learned_lesson__pcr=pcr)
    lesson.description = None
    lesson.save()
    gender_mainstreaming = PCRGenderMainstreaming.objects.get(pcr=pcr)
    gender_mainstreaming.prefilled = None
    gender_mainstreaming.qualitative_description = ""
    gender_mainstreaming.save()
    goal = PCRSustainableDevelopmentGoalDescription.objects.get(sgr__pcr=pcr)
    goal.description = ""
    goal.save()

    assert get_pcr_submission_errors(pcr) == {
        "pcr_projects": {
            pcr_project.project_id: {
                "equipments": {equipment.id: {"disposal_date": REQUIRED}}
            }
        },
        "delay_causes": {
            lead_agency.id: {
                root_cause.delay_cause_id: {
                    "root_causes_of_delay": {root_cause.id: {"action_taken": REQUIRED}}
                }
            }
        },
        "learned_lessons": {lead_agency.id: {lesson.id: {"description": REQUIRED}}},
        "gender_mainstreamings": {
            lead_agency.id: {
                gender_mainstreaming.id: {
                    "prefilled": REQUIRED,
                    "qualitative_description": REQUIRED,
                }
            }
        },
        "sustainable_development_goals": {
            lead_agency.id: {"goals": {goal.id: {"description": REQUIRED}}}
        },
    }


def test_delay_cause_requires_root_cause(pcr, lead_agency):
    root_cause = PCRDelayCauseRootCause.objects.get(delay_cause__pcr=pcr)
    root_cause.delete()

    assert get_pcr_submission_errors(pcr) == {
        "delay_causes": {
            lead_agency.id: {
                root_cause.delay_cause_id: {"root_causes_of_delay": REQUIRED}
            }
        }
    }


def test_sdg_not_applying_requires_explanation(pcr, lead_agency):
    sdg = PCRSustainableDevelopmentGoal.objects.get(pcr=pcr)
    sdg.pcrsustainabledevelopmentgoaldescription_set.all().delete()
    sdg.sdg_applying = False
    sdg.save()

    assert get_pcr_submission_errors(pcr) == {
        "sustainable_development_goals": {
            lead_agency.id: {"sdg_not_applying_explanation": REQUIRED}
        }
    }

    sdg.sdg_not_applying_explanation = "Not relevant"
    sdg.save()
    assert get_pcr_submission_errors(pcr) == {}


def test_every_project_agency_is_required(pcr):
    # A cooperating agency project added after the data was filled
    cooperating_agency = AgencyFactory.create()
    project = ProjectFactory.create(
        meta_project=pcr.meta_project, agency=cooperating_agency
    )
    PCRProject.objects.create(pcr=pcr, project=project)

    errors = get_pcr_submission_errors(pcr)

    assert set(errors["pcr_projects"]) == {project.id}
    for section in [
        "overall_assessment_highlights",
        "delay_causes",
        "learned_lessons",
        "future_project_recommendations",
        "gender_mainstreamings",
        "supporting_evidences",
    ]:
        assert errors[section] == {cooperating_agency.id: REQUIRED}
    assert errors["sustainable_development_goals"] == {
        cooperating_agency.id: {"goals": REQUIRED}
    }


def test_submit_incomplete_pcr(client, empty_pcr):
    response = client.post(_action_url(empty_pcr, "submit"))

    assert response.status_code == 400
    assert response.data["error"] == (
        "PCR cannot be submitted, required data is missing in: Overview, "
        "Summary of key data, Project results, Causes of delay, Lessons learned, "
        "Gender mainstreaming, SDGs, Other supporting evidence."
    )
    assert "financial_figures_status" in response.data["errors"]

    empty_pcr.refresh_from_db()
    assert empty_pcr.version == 1
    assert empty_pcr.status == PCR.Status.DRAFT
    assert empty_pcr.submission_date is None
    assert not PCR.objects.really_all().filter(latest_pcr=empty_pcr).exists()


def test_resubmit_incomplete_pcr(client, pcr):
    _set_state(pcr, 2, PCR.Status.REVISION_ADJUSTMENTS_REQUESTED)
    PCRAdditionalComment.objects.filter(pcr=pcr).delete()

    response = client.post(_action_url(pcr, "submit"))

    assert response.status_code == 400
    assert response.data["error"] == (
        "PCR cannot be submitted, required data is missing in: Overview."
    )
    assert response.data["errors"] == {"additional_comments": REQUIRED}
    pcr.refresh_from_db()
    assert pcr.status == PCR.Status.REVISION_ADJUSTMENTS_REQUESTED
    assert pcr.revised_submission_date is None


def test_approve_incomplete_pcr(client, pcr):
    _set_state(pcr, 2, PCR.Status.REVISION)
    PCR.objects.filter(pk=pcr.pk).update(completed_by=None)

    response = client.post(_action_url(pcr, "approve"))

    assert response.status_code == 400
    assert response.data["error"] == (
        "PCR cannot be approved, required data is missing in: Overview."
    )
    assert response.data["errors"] == {"completed_by": REQUIRED}
    pcr.refresh_from_db()
    assert pcr.version == 2
    assert pcr.status == PCR.Status.REVISION
    assert not PCR.objects.really_all().filter(latest_pcr=pcr).exists()


def test_invalid_transition_is_checked_before_data(client, empty_pcr):
    _set_state(empty_pcr, 3, PCR.Status.APPROVED)

    response = client.post(_action_url(empty_pcr, "submit"))

    assert response.status_code == 400
    assert "errors" not in response.data


def test_partial_update_keeps_sdgs_and_supporting_evidences(client, pcr):
    response = client.patch(
        reverse("project-completion-report-detail", args=[pcr.id]),
        {
            "metadata": json.dumps({"addresses": "New"}, cls=DjangoJSONEncoder),
            "files": [],
        },
        format="multipart",
    )

    assert response.status_code == 200
    assert pcr.sustainable_development_goals.exists()
    assert pcr.supporting_evidences.exists()
    assert get_pcr_submission_errors(pcr) == {}
