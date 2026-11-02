import io
import json
from datetime import date, datetime, timezone as dt_timezone
from unittest.mock import patch

import openpyxl
import pytest
from django.core.serializers.json import DjangoJSONEncoder
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.factories import (
    CountryFactory,
    MetaProjectFactory,
    ProjectClusterFactory,
    ProjectFactory,
)
from core.models.project_completion_report import PCR, PCRHistory, PCRProject

# pylint: disable=unused-argument

pytestmark = pytest.mark.django_db

HISTORY_DESCRIPTION_CREATE = "PCR created"
HISTORY_DESCRIPTION_SAVE = "PCR saved"
HISTORY_DESCRIPTION_SUBMIT_V1 = "PCR initial submission"
HISTORY_DESCRIPTION_RESUBMIT_V2 = "PCR resubmission after adjustments"
HISTORY_DESCRIPTION_REQUEST_ADJUSTMENTS_V2 = "Adjustment requested from Lead Agency"
HISTORY_DESCRIPTION_APPROVE_V3 = "PCR approved"

SUBMIT_DATE = date(2026, 7, 1)
RESUBMIT_DATE = date(2026, 8, 15)


@pytest.fixture(name="client")
def _client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture(name="pcr")
def _pcr():
    meta_project = MetaProjectFactory.create()
    project = ProjectFactory.create(
        meta_project=meta_project,
        code="ABC/FOA/90/INV/01",
        metacode="ABC/FOA",
        title="Foam conversion",
        country=CountryFactory.create(name="Narnia"),
        cluster=ProjectClusterFactory.create(name="Foam cluster"),
    )
    pcr = PCR.objects.create(meta_project=meta_project)
    PCRProject.objects.create(pcr=pcr, project=project)
    return pcr


def _post(client, pcr, action, on_date=None):
    url = reverse(
        f"project-completion-report-{action.replace('_', '-')}", args=[pcr.id]
    )
    if on_date is None:
        return client.post(url)
    with patch(
        "core.api.views.project_completion_report.pcr_workflow.timezone"
    ) as mock_timezone:
        mock_timezone.now.return_value = datetime.combine(
            on_date, datetime.min.time(), tzinfo=dt_timezone.utc
        )
        return client.post(url)


def _patch_pcr(client, pcr, data):
    return client.patch(
        reverse("project-completion-report-detail", args=[pcr.id]),
        {"metadata": json.dumps(data, cls=DjangoJSONEncoder), "files": []},
        format="multipart",
    )


def _history(pcr, *fields):
    fields = fields or ("description",)
    return list(
        PCRHistory.objects.filter(pcr=pcr)
        .order_by("created_at", "id")
        .values_list(*fields, flat=len(fields) == 1)
    )


def _results(response):
    if isinstance(response.data, dict) and "results" in response.data:
        return response.data["results"]
    return response.data


def _export_rows(response):
    wb = openpyxl.load_workbook(io.BytesIO(b"".join(response.streaming_content)))
    sheet = wb["PCR submission log"]
    return [list(row) for row in sheet.iter_rows(values_only=True)]


def test_create_logs_history_and_sets_creator(client, admin_user):
    meta_project = MetaProjectFactory.create()
    ProjectFactory.create(meta_project=meta_project)

    response = client.post(
        reverse("project-completion-report-list"),
        {
            "metadata": json.dumps(
                {"meta_project_id": meta_project.id, "submission_date": "2026-07-10"},
                cls=DjangoJSONEncoder,
            ),
            "files": [],
        },
        format="multipart",
    )

    assert response.status_code == 201
    pcr = PCR.objects.get(meta_project=meta_project)
    assert pcr.version_created_by == admin_user
    # submission_date is set by the server on submit, not by the client
    assert pcr.submission_date is None
    history = PCRHistory.objects.get(pcr=pcr)
    assert history.description == HISTORY_DESCRIPTION_CREATE
    assert history.user == admin_user
    assert history.lock_action is None


def test_workflow_logs_history_and_submission_dates(client, admin_user, pcr):
    response = _post(client, pcr, "submit", SUBMIT_DATE)
    assert response.data["submission_date"] == "2026-07-01"
    assert response.data["revised_submission_date"] is None

    _post(client, pcr, "request_adjustments")
    response = _post(client, pcr, "submit", RESUBMIT_DATE)
    assert response.data["submission_date"] == "2026-07-01"
    assert response.data["revised_submission_date"] == "2026-08-15"

    _post(client, pcr, "approve")

    pcr.refresh_from_db()
    assert pcr.submission_date == SUBMIT_DATE
    assert pcr.revised_submission_date == RESUBMIT_DATE
    assert _history(pcr, "description", "lock_action") == [
        (HISTORY_DESCRIPTION_SUBMIT_V1, PCRHistory.LockAction.LOCKED),
        (HISTORY_DESCRIPTION_REQUEST_ADJUSTMENTS_V2, PCRHistory.LockAction.UNLOCKED),
        (HISTORY_DESCRIPTION_RESUBMIT_V2, PCRHistory.LockAction.LOCKED),
        (HISTORY_DESCRIPTION_APPROVE_V3, None),
    ]
    assert set(PCRHistory.objects.values_list("user", flat=True)) == {admin_user.id}


def test_revised_submission_date_tracks_latest_resubmission(client, pcr):
    _post(client, pcr, "submit", SUBMIT_DATE)
    for resubmit_date in [date(2026, 8, 1), date(2026, 9, 1)]:
        _post(client, pcr, "request_adjustments")
        _post(client, pcr, "submit", resubmit_date)

    pcr.refresh_from_db()
    assert pcr.submission_date == SUBMIT_DATE
    assert pcr.revised_submission_date == date(2026, 9, 1)


def test_edits_are_logged_and_cannot_set_submission_dates(client, admin_user, pcr):
    _post(client, pcr, "submit", SUBMIT_DATE)

    response = _patch_pcr(
        client,
        pcr,
        {
            "addresses": "Edited by the Secretariat",
            "submission_date": "2020-01-01",
            "revised_submission_date": "2020-01-01",
        },
    )

    assert response.status_code == 200
    pcr.refresh_from_db()
    assert pcr.addresses == "Edited by the Secretariat"
    assert pcr.submission_date == SUBMIT_DATE
    assert pcr.revised_submission_date is None
    assert _history(pcr, "description", "lock_action", "user") == [
        (HISTORY_DESCRIPTION_SUBMIT_V1, PCRHistory.LockAction.LOCKED, admin_user.id),
        (HISTORY_DESCRIPTION_SAVE, None, admin_user.id),
    ]


def test_rejected_edit_of_final_pcr_is_not_logged(client, pcr):
    PCR.objects.filter(pk=pcr.pk).update(version=3, status=PCR.Status.FINAL)

    response = _patch_pcr(client, pcr, {"addresses": "Changed"})

    assert response.status_code == 400
    assert not PCRHistory.objects.filter(pcr=pcr).exists()


def test_failed_transition_is_not_logged(client, pcr):
    response = _post(client, pcr, "approve")

    assert response.status_code == 400
    assert not PCRHistory.objects.filter(pcr=pcr).exists()


def test_detail_history_is_shared_by_archived_versions(client, pcr):
    _post(client, pcr, "submit")
    archived = PCR.objects.really_all().get(latest_pcr=pcr)

    for pcr_id in [pcr.id, archived.id]:
        response = client.get(
            reverse("project-completion-report-detail", args=[pcr_id])
        )
        assert response.status_code == 200
        assert [
            (h["description"], h["lock_action"]) for h in response.data["history"]
        ] == [(HISTORY_DESCRIPTION_SUBMIT_V1, PCRHistory.LockAction.LOCKED)]
        assert response.data["history"][0]["user"]["username"]


@pytest.mark.parametrize(
    "actions,is_locked",
    [
        ([], False),
        (["submit"], True),
        (["submit", "request_adjustments"], False),
        (["submit", "request_adjustments", "submit"], True),
        (["submit", "approve"], True),
    ],
)
def test_lock_follows_workflow(client, pcr, actions, is_locked):
    for workflow_action in actions:
        assert _post(client, pcr, workflow_action).status_code == 200

    response = client.get(reverse("project-completion-report-detail", args=[pcr.id]))
    assert response.data["is_locked"] is is_locked

    response = client.get(reverse("project-completion-report-list"))
    assert _results(response)[0]["pcr_is_locked"] is is_locked


def test_list_exposes_submission_dates(client, pcr):
    _post(client, pcr, "submit", SUBMIT_DATE)
    _post(client, pcr, "request_adjustments")
    _post(client, pcr, "submit", RESUBMIT_DATE)

    response = client.get(reverse("project-completion-report-list"))

    row = _results(response)[0]
    assert row["initial_submission_date"] == "2026-07-01"
    assert row["revised_submission_date"] == "2026-08-15"


def test_export_submission_log(client, pcr):
    draft_pcr = PCR.objects.create(meta_project=MetaProjectFactory.create())
    PCRProject.objects.create(
        pcr=draft_pcr,
        project=ProjectFactory.create(
            meta_project=draft_pcr.meta_project, title="Draft project"
        ),
    )
    _post(client, pcr, "submit", SUBMIT_DATE)
    _post(client, pcr, "request_adjustments")
    _post(client, pcr, "submit", RESUBMIT_DATE)

    response = client.get(
        reverse("project-completion-report-export"), {"ordering": "project__title"}
    )

    assert response.status_code == 200
    rows = _export_rows(response)
    assert rows[0] == [
        "Project metacode",
        "Project code",
        "Country",
        "Cluster",
        "Title",
        "Initial submission date",
        "Revised submission date",
        "Locked",
    ]
    # archived versions are not exported
    assert len(rows) == 3
    assert rows[2] == [
        "ABC/FOA",
        "ABC/FOA/90/INV/01",
        "Narnia",
        "Foam cluster",
        "Foam conversion",
        "01.07.2026",
        "15.08.2026",
        "Yes",
    ]
    assert rows[1][4] == "Draft project"
    assert rows[1][5:] == [None, None, "No"]


def test_export_applies_listing_filters(client, pcr):
    other_pcr = PCR.objects.create(meta_project=MetaProjectFactory.create())
    PCRProject.objects.create(
        pcr=other_pcr,
        project=ProjectFactory.create(
            meta_project=other_pcr.meta_project, title="Other project"
        ),
    )

    response = client.get(
        reverse("project-completion-report-export"), {"search": "Foam conversion"}
    )

    rows = _export_rows(response)
    assert [row[4] for row in rows[1:]] == ["Foam conversion"]


def test_export_permissions(pcr, user):
    client = APIClient()
    url = reverse("project-completion-report-export")
    assert client.get(url).status_code == 403

    client.force_authenticate(user=user)
    assert client.get(url).status_code == 403
