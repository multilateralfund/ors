import json
from decimal import Decimal
from unittest.mock import patch

import pytest
from constance import config
from django.core import mail
from django.core.serializers.json import DjangoJSONEncoder
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.factories import MetaProjectFactory, ProjectFactory
from core.models.project import Project
from core.models.project_completion_report import (
    PCR,
    PCRAdditionalComment,
    PCRProject,
)
from core.tasks import send_pcr_notification

# pylint: disable=unused-argument

pytestmark = pytest.mark.django_db


@pytest.fixture(name="client")
def _client():
    return APIClient()


@pytest.fixture(name="pcr")
def _pcr():
    meta_project = MetaProjectFactory.create()
    project = ProjectFactory.create(meta_project=meta_project)
    pcr = PCR.objects.create(meta_project=meta_project, addresses="Initial address")
    PCRProject.objects.create(
        pcr=pcr, project=project, funds_disbursed=Decimal("100.00")
    )
    PCRAdditionalComment.objects.create(pcr=pcr, entity="Lead agency", comment="V1")
    return pcr


@pytest.fixture(name="mock_send_pcr_notification")
def _mock_send_pcr_notification():
    with patch("core.tasks.send_pcr_notification.delay") as send_mail:
        yield send_mail


@pytest.fixture(name="pcr_notifications_enabled")
def _pcr_notifications_enabled():
    config.PCR_NOTIFICATIONS_ENABLED = True
    config.PCR_NOTIFICATIONS_EMAILS = "mlfs@ors.org"
    yield
    config.PCR_NOTIFICATIONS_ENABLED = False
    config.PCR_NOTIFICATIONS_EMAILS = ""


def _results(response):
    if isinstance(response.data, dict) and "results" in response.data:
        return response.data["results"]
    return response.data


def _action_url(pcr, action):
    return reverse(
        f"project-completion-report-{action.replace('_', '-')}", args=[pcr.id]
    )


def _set_state(pcr, version, status):
    PCR.objects.filter(pk=pcr.pk).update(version=version, status=status)
    pcr.refresh_from_db()


def _archived_versions(pcr):
    return PCR.objects.really_all().filter(latest_pcr=pcr).order_by("version")


def _patch_pcr(client, pcr, data):
    return client.patch(
        reverse("project-completion-report-detail", args=[pcr.id]),
        {"metadata": json.dumps(data, cls=DjangoJSONEncoder), "files": []},
        format="multipart",
    )


def test_new_pcr_is_draft_version_1(pcr):
    assert pcr.version == 1
    assert pcr.status == PCR.Status.DRAFT
    assert pcr.is_editable


def test_submit_archives_v1_and_creates_v2(
    client, admin_user, pcr, mock_send_pcr_notification
):
    client.force_authenticate(user=admin_user)

    response = client.post(_action_url(pcr, "submit"))

    assert response.status_code == 200
    assert response.data["version"] == 2
    assert response.data["status"] == PCR.Status.SUBMITTED
    assert response.data["submission_date"] is not None

    pcr.refresh_from_db()
    assert pcr.version == 2
    assert pcr.status == PCR.Status.SUBMITTED
    assert pcr.version_created_by == admin_user

    archived = _archived_versions(pcr).get()
    assert archived.version == 1
    assert archived.status == PCR.Status.DRAFT
    assert archived.addresses == "Initial address"
    assert archived.pcr_projects.count() == 1
    assert archived.additional_comments.get().comment == "V1"
    # disabled by default
    mock_send_pcr_notification.assert_not_called()


def test_submit_sends_notification(
    client, admin_user, pcr, pcr_notifications_enabled, mock_send_pcr_notification
):
    client.force_authenticate(user=admin_user)

    response = client.post(_action_url(pcr, "submit"))

    assert response.status_code == 200
    mock_send_pcr_notification.assert_called_once_with(pcr.id)


def test_request_adjustments_keeps_v2(client, admin_user, pcr):
    _set_state(pcr, 2, PCR.Status.SUBMITTED)
    client.force_authenticate(user=admin_user)

    response = client.post(_action_url(pcr, "request_adjustments"))

    assert response.status_code == 200
    pcr.refresh_from_db()
    assert pcr.version == 2
    assert pcr.status == PCR.Status.ADJUSTMENTS_REQUESTED
    assert not _archived_versions(pcr).exists()


def test_resubmit_after_adjustments_does_not_create_new_version(
    client, admin_user, pcr, mock_send_pcr_notification, pcr_notifications_enabled
):
    client.force_authenticate(user=admin_user)
    client.post(_action_url(pcr, "submit"))

    for _ in range(2):
        response = client.post(_action_url(pcr, "request_adjustments"))
        assert response.status_code == 200
        response = client.post(_action_url(pcr, "submit"))
        assert response.status_code == 200

    pcr.refresh_from_db()
    assert pcr.version == 2
    assert pcr.status == PCR.Status.SUBMITTED
    assert [p.version for p in _archived_versions(pcr)] == [1]
    assert mock_send_pcr_notification.call_count == 3


def test_v2_is_editable_while_adjustments_requested(client, admin_user, pcr):
    _set_state(pcr, 2, PCR.Status.ADJUSTMENTS_REQUESTED)
    client.force_authenticate(user=admin_user)

    response = _patch_pcr(client, pcr, {"addresses": "Adjusted address"})

    assert response.status_code == 200
    pcr.refresh_from_db()
    assert pcr.addresses == "Adjusted address"
    assert pcr.version == 2


def test_approve_archives_v2_and_creates_final_v3(
    client, admin_user, pcr, mock_send_pcr_notification, pcr_notifications_enabled
):
    client.force_authenticate(user=admin_user)
    client.post(_action_url(pcr, "submit"))
    _patch_pcr(client, pcr, {"addresses": "MLFS revised address"})

    response = client.post(_action_url(pcr, "approve"))

    assert response.status_code == 200
    assert response.data["version"] == 3
    assert response.data["status"] == PCR.Status.FINAL
    assert response.data["is_editable"] is False

    pcr.refresh_from_db()
    assert pcr.version == 3
    assert pcr.status == PCR.Status.FINAL

    archived = list(_archived_versions(pcr))
    assert [(p.version, p.status) for p in archived] == [
        (1, PCR.Status.DRAFT),
        (2, PCR.Status.SUBMITTED),
    ]
    assert archived[0].addresses == "Initial address"
    assert archived[1].addresses == "MLFS revised address"
    mock_send_pcr_notification.assert_called_with(pcr.id, is_final=True)


def test_final_pcr_is_not_editable(client, admin_user, pcr):
    _set_state(pcr, 3, PCR.Status.FINAL)
    client.force_authenticate(user=admin_user)

    response = _patch_pcr(client, pcr, {"addresses": "Changed"})

    assert response.status_code == 400
    pcr.refresh_from_db()
    assert pcr.addresses == "Initial address"


def test_archived_version_can_be_retrieved_but_not_edited(client, admin_user, pcr):
    client.force_authenticate(user=admin_user)
    client.post(_action_url(pcr, "submit"))
    archived = _archived_versions(pcr).get()

    response = client.get(
        reverse("project-completion-report-detail", args=[archived.id])
    )
    assert response.status_code == 200
    assert response.data["version"] == 1
    assert response.data["latest_pcr_id"] == pcr.id
    assert response.data["is_editable"] is False

    response = _patch_pcr(client, archived, {"addresses": "Changed"})
    assert response.status_code == 404
    response = client.post(_action_url(archived, "submit"))
    assert response.status_code == 404


@pytest.mark.parametrize(
    "action,version,status",
    [
        ("submit", 2, PCR.Status.SUBMITTED),
        ("submit", 3, PCR.Status.FINAL),
        ("request_adjustments", 1, PCR.Status.DRAFT),
        ("request_adjustments", 2, PCR.Status.ADJUSTMENTS_REQUESTED),
        ("request_adjustments", 3, PCR.Status.FINAL),
        ("approve", 1, PCR.Status.DRAFT),
        ("approve", 2, PCR.Status.ADJUSTMENTS_REQUESTED),
        ("approve", 3, PCR.Status.FINAL),
    ],
)
def test_invalid_transitions(client, admin_user, pcr, action, version, status):
    _set_state(pcr, version, status)
    client.force_authenticate(user=admin_user)

    response = client.post(_action_url(pcr, action))

    assert response.status_code == 400
    assert "error" in response.data
    pcr.refresh_from_db()
    assert pcr.version == version
    assert pcr.status == status
    assert not _archived_versions(pcr).exists()


def test_versions_lists_all_versions(client, admin_user, pcr):
    client.force_authenticate(user=admin_user)
    client.post(_action_url(pcr, "submit"))
    client.post(_action_url(pcr, "approve"))
    archived_v1 = _archived_versions(pcr).first()

    for pcr_id in [pcr.id, archived_v1.id]:
        response = client.get(
            reverse("project-completion-report-versions", args=[pcr_id])
        )
        assert response.status_code == 200
        assert [(v["version"], v["status"]) for v in response.data] == [
            (1, PCR.Status.DRAFT),
            (2, PCR.Status.SUBMITTED),
            (3, PCR.Status.FINAL),
        ]
        assert response.data[2]["id"] == pcr.id


def test_list_excludes_archived_versions(client, admin_user, pcr):
    client.force_authenticate(user=admin_user)
    client.post(_action_url(pcr, "submit"))

    response = client.get(reverse("project-completion-report-list"))

    assert response.status_code == 200
    results = _results(response)
    assert [row["pcr_id"] for row in results] == [pcr.id]
    assert results[0]["pcr_version"] == 2
    assert results[0]["pcr_status"] == PCR.Status.SUBMITTED


def test_project_pcr_filters_ignore_archived_versions(client, admin_user, pcr):
    client.force_authenticate(user=admin_user)
    client.post(_action_url(pcr, "submit"))
    project = pcr.pcr_projects.get().project
    Project.objects.filter(pk=project.pk).update(production=False)

    url = reverse("project-v2-list")
    response = client.get(url, {"pcr_submitted": "Yes"})
    assert response.status_code == 200
    ids = [row["id"] for row in _results(response)]
    assert ids.count(project.id) == 1


def test_workflow_actions_permissions(client, user, pcr):
    for action in ["submit", "request_adjustments", "approve"]:
        response = client.post(_action_url(pcr, action))
        assert response.status_code == 403

        client.force_authenticate(user=user)
        response = client.post(_action_url(pcr, action))
        assert response.status_code == 403
        client.force_authenticate(user=None)


def test_send_pcr_notification(pcr, pcr_notifications_enabled):
    send_pcr_notification(pcr.id)
    send_pcr_notification(pcr.id, is_final=True)

    assert len(mail.outbox) == 2
    assert "New PCR submission" in mail.outbox[0].subject
    assert "Final PCR version available" in mail.outbox[1].subject
    assert mail.outbox[0].bcc == ["mlfs@ors.org"]
    assert f"/pcr/{pcr.meta_project_id}/{pcr.id}/" in mail.outbox[1].body
