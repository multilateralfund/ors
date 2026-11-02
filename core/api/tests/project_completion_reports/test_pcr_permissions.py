import json
from decimal import Decimal

import pytest
from django.contrib.auth.models import Group
from django.core.serializers.json import DjangoJSONEncoder
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.factories import MetaProjectFactory, ProjectFactory, UserFactory
from core.models.project_completion_report import PCR, PCRProject

# pylint: disable=unused-argument,redefined-outer-name,too-many-arguments

pytestmark = pytest.mark.django_db


def _pcr_user(group_name, agency=None):
    user = UserFactory(agency=agency)
    user.groups.add(Group.objects.get(name=group_name))
    return user


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def pcr_viewer(agency):
    return _pcr_user("PCR - Viewer", agency)


@pytest.fixture
def pcr_inputter(agency):
    return _pcr_user("PCR - Inputter", agency)


@pytest.fixture
def pcr_submitter(agency):
    return _pcr_user("PCR - Submitter", agency)


@pytest.fixture
def pcr_secretariat():
    return _pcr_user("PCR - Secretariat")


@pytest.fixture
def pcr_full_access():
    return _pcr_user("PCR - Full access")


def _create_pcr(agency, production=False, status=PCR.Status.DRAFT):
    version = 1 if status == PCR.Status.DRAFT else 2
    meta_project = MetaProjectFactory.create()
    project = ProjectFactory.create(
        meta_project=meta_project,
        agency=agency,
        lead_agency=agency,
        production=production,
    )
    pcr = PCR.objects.create(meta_project=meta_project, version=version, status=status)
    PCRProject.objects.create(
        pcr=pcr, project=project, funds_disbursed=Decimal("100.00")
    )
    return pcr


@pytest.fixture
def own_pcr(agency):
    return _create_pcr(agency)


@pytest.fixture
def other_agency_pcr(other_agency):
    return _create_pcr(other_agency)


@pytest.fixture
def production_pcr(agency):
    return _create_pcr(agency, production=True)


def _list_pcr_ids(client, user):
    client.force_authenticate(user=user)
    response = client.get(reverse("project-completion-report-list"))
    assert response.status_code == 200
    return {row["pcr_id"] for row in response.data}


def _detail_url(pcr):
    return reverse("project-completion-report-detail", args=[pcr.id])


def _action_url(pcr, action):
    return reverse(
        f"project-completion-report-{action.replace('_', '-')}", args=[pcr.id]
    )


def _patch_pcr(client, pcr):
    return client.patch(
        _detail_url(pcr),
        {
            "metadata": json.dumps({"addresses": "Updated"}, cls=DjangoJSONEncoder),
            "files": [],
        },
        format="multipart",
    )


def _set_status(pcr, status):
    PCR.objects.filter(pk=pcr.pk).update(
        version=1 if status == PCR.Status.DRAFT else 2, status=status
    )


def test_groups_permissions():
    def _permissions(group_name):
        return set(
            Group.objects.get(name=group_name).permissions.values_list(
                "codename", flat=True
            )
        )

    workflow_permissions = {
        "has_pcr_edit_access",
        "has_pcr_edit_submitted_access",
        "has_pcr_submit_access",
        "has_pcr_request_adjustments_access",
        "has_pcr_approve_access",
    }
    assert _permissions("PCR - Viewer") & workflow_permissions == set()
    assert _permissions("PCR - Inputter") & workflow_permissions == {
        "has_pcr_edit_access"
    }
    assert _permissions("PCR - Submitter") & workflow_permissions == {
        "has_pcr_edit_access",
        "has_pcr_submit_access",
    }
    assert _permissions("PCR - Secretariat") & workflow_permissions == {
        "has_pcr_request_adjustments_access",
        "has_pcr_approve_access",
    }
    assert _permissions("PCR - Full access") >= workflow_permissions


class TestVisibility:
    def test_agency_users_see_only_own_agency(
        self, client, pcr_viewer, own_pcr, other_agency_pcr, production_pcr
    ):
        assert _list_pcr_ids(client, pcr_viewer) == {own_pcr.id, production_pcr.id}

        assert client.get(_detail_url(own_pcr)).status_code == 200
        assert client.get(_detail_url(other_agency_pcr)).status_code == 404
        assert client.get(_action_url(other_agency_pcr, "versions")).status_code == 404

    def test_mlfs_users_see_all_agencies_but_not_production(
        self,
        client,
        pcr_secretariat,
        pcr_full_access,
        own_pcr,
        other_agency_pcr,
        production_pcr,
    ):
        for user in [pcr_secretariat, pcr_full_access]:
            assert _list_pcr_ids(client, user) == {own_pcr.id, other_agency_pcr.id}
            assert client.get(_detail_url(production_pcr)).status_code == 404

    def test_production_access_comes_from_projects_permission(
        self, client, pcr_full_access, production_pcr
    ):
        pcr_full_access.groups.add(
            Group.objects.get(name="Projects - MLFS Production Approver")
        )
        assert production_pcr.id in _list_pcr_ids(client, pcr_full_access)

    def test_metaprojects_listing(
        self, client, pcr_viewer, own_pcr, other_agency_pcr, project_approved_status
    ):
        for pcr in [own_pcr, other_agency_pcr]:
            pcr.meta_project.projects.update(submission_status=project_approved_status)
        client.force_authenticate(user=pcr_viewer)
        response = client.get(reverse("pcr-metaprojects-list"))
        assert response.status_code == 200
        assert {row["id"] for row in response.data} == {own_pcr.meta_project_id}


class TestEdit:
    def test_viewer_cannot_edit(self, client, pcr_viewer, own_pcr):
        client.force_authenticate(user=pcr_viewer)
        assert _patch_pcr(client, own_pcr).status_code == 403
        response = client.get(_detail_url(own_pcr))
        assert response.data["editable"] is False

    def test_inputter_edits_own_unlocked_pcr(
        self, client, pcr_inputter, own_pcr, other_agency_pcr
    ):
        client.force_authenticate(user=pcr_inputter)
        assert client.get(_detail_url(own_pcr)).data["editable"] is True
        assert _patch_pcr(client, own_pcr).status_code == 200
        assert _patch_pcr(client, other_agency_pcr).status_code == 404

        _set_status(own_pcr, PCR.Status.ADJUSTMENTS_REQUESTED)
        assert _patch_pcr(client, own_pcr).status_code == 200

    def test_agency_cannot_edit_submitted_pcr(self, client, pcr_inputter, own_pcr):
        _set_status(own_pcr, PCR.Status.SUBMITTED)
        client.force_authenticate(user=pcr_inputter)
        assert client.get(_detail_url(own_pcr)).data["editable"] is False
        assert _patch_pcr(client, own_pcr).status_code == 404

    def test_full_access_can_edit_submitted_pcr(
        self, client, pcr_full_access, other_agency_pcr
    ):
        _set_status(other_agency_pcr, PCR.Status.SUBMITTED)
        client.force_authenticate(user=pcr_full_access)
        assert client.get(_detail_url(other_agency_pcr)).data["editable"] is True
        assert _patch_pcr(client, other_agency_pcr).status_code == 200

    def test_secretariat_cannot_edit(self, client, pcr_secretariat, own_pcr):
        _set_status(own_pcr, PCR.Status.SUBMITTED)
        client.force_authenticate(user=pcr_secretariat)
        assert client.get(_detail_url(own_pcr)).data["editable"] is False
        assert _patch_pcr(client, own_pcr).status_code == 403

    def test_list_editable(self, client, pcr_inputter, own_pcr):
        client.force_authenticate(user=pcr_inputter)
        response = client.get(reverse("project-completion-report-list"))
        assert [row["pcr_editable"] for row in response.data] == [True]


class TestCreate:
    @staticmethod
    def _create(client, meta_project):
        return client.post(
            reverse("project-completion-report-list"),
            {
                "metadata": json.dumps(
                    {"meta_project_id": meta_project.id}, cls=DjangoJSONEncoder
                ),
                "files": [],
            },
            format="multipart",
        )

    def test_agency_creates_only_for_own_meta_projects(
        self, client, pcr_inputter, pcr_viewer, agency, other_agency
    ):
        own_meta_project = MetaProjectFactory.create()
        ProjectFactory.create(meta_project=own_meta_project, agency=agency)
        other_meta_project = MetaProjectFactory.create()
        ProjectFactory.create(meta_project=other_meta_project, agency=other_agency)

        client.force_authenticate(user=pcr_viewer)
        assert self._create(client, own_meta_project).status_code == 403

        client.force_authenticate(user=pcr_inputter)
        assert self._create(client, other_meta_project).status_code == 403
        assert self._create(client, own_meta_project).status_code == 201

        url = reverse("project-completion-report-create-defaults")
        response = client.get(url, {"meta_project_id": other_meta_project.id})
        assert response.status_code == 404
        response = client.get(url, {"meta_project_id": own_meta_project.id})
        assert response.status_code == 200


class TestWorkflow:
    def test_submit(self, client, pcr_inputter, pcr_submitter, own_pcr):
        client.force_authenticate(user=pcr_inputter)
        assert client.post(_action_url(own_pcr, "submit")).status_code == 403

        client.force_authenticate(user=pcr_submitter)
        response = client.post(_action_url(own_pcr, "submit"))
        assert response.status_code == 200
        # locked for the agency after submission
        assert response.data["editable"] is False

    def test_submitter_cannot_submit_other_agency_pcr(
        self, client, pcr_submitter, other_agency_pcr
    ):
        client.force_authenticate(user=pcr_submitter)
        response = client.post(_action_url(other_agency_pcr, "submit"))
        assert response.status_code == 404

    @pytest.mark.parametrize("action", ["request_adjustments", "approve"])
    def test_mlfs_actions(
        self, client, pcr_submitter, pcr_secretariat, pcr_full_access, action
    ):
        for user in [pcr_secretariat, pcr_full_access]:
            pcr = _create_pcr(pcr_submitter.agency, status=PCR.Status.SUBMITTED)

            client.force_authenticate(user=pcr_submitter)
            assert client.post(_action_url(pcr, action)).status_code == 403

            client.force_authenticate(user=user)
            assert client.post(_action_url(pcr, action)).status_code == 200

    def test_adjustments_unlock_pcr_for_agency(
        self, client, pcr_inputter, pcr_secretariat, own_pcr
    ):
        _set_status(own_pcr, PCR.Status.SUBMITTED)
        client.force_authenticate(user=pcr_secretariat)
        client.post(_action_url(own_pcr, "request_adjustments"))

        client.force_authenticate(user=pcr_inputter)
        assert client.get(_detail_url(own_pcr)).data["editable"] is True


class TestSetPCRDue:
    url = reverse("pcr-metaprojects-set-pcr-or-ad-hoc")

    def test_permissions(
        self, client, pcr_submitter, pcr_secretariat, pcr_full_access, own_pcr
    ):
        data = {"meta_projects": [own_pcr.meta_project_id], "pcr_due": True}

        client.force_authenticate(user=pcr_submitter)
        assert client.post(self.url, data, format="json").status_code == 403

        for user in [pcr_secretariat, pcr_full_access]:
            client.force_authenticate(user=user)
            assert client.post(self.url, data, format="json").status_code == 200

    def test_production_meta_project(self, client, pcr_secretariat, production_pcr):
        client.force_authenticate(user=pcr_secretariat)
        data = {"meta_projects": [production_pcr.meta_project_id], "pcr_due": True}
        assert client.post(self.url, data, format="json").status_code == 403
