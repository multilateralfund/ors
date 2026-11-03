from datetime import date

import pytest
from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    MetaProjectFactory,
    OldPCRActivityFactory,
    OldPCRDelayExplanationFactory,
    OldPCRFactory,
    OldPCRLearnedLessonsFactory,
    PCRFactory,
    ProjectFactory,
    UserFactory,
)
from core.models.project_completion_report import OLD_PCR, PCR

# pylint: disable=unused-argument,redefined-outer-name

pytestmark = pytest.mark.django_db


def _create_meta_project(agency, submission_status):
    meta_project = MetaProjectFactory()
    ProjectFactory(
        meta_project=meta_project,
        metacode=meta_project.umbrella_code,
        agency=agency,
        lead_agency=agency,
        submission_status=submission_status,
    )
    return meta_project


def _create_old_pcr(agency, submission_status):
    old_pcr = OldPCRFactory(
        meta_project=_create_meta_project(agency, submission_status),
        submission_date=date(2015, 3, 4),
    )
    OldPCRActivityFactory.create_batch(2, old_pcr=old_pcr)
    OldPCRDelayExplanationFactory(old_pcr=old_pcr, agency=agency)
    OldPCRLearnedLessonsFactory(old_pcr=old_pcr, agency=agency)
    return old_pcr


@pytest.fixture
def own_old_pcr(agency, project_approved_status):
    return _create_old_pcr(agency, project_approved_status)


@pytest.fixture
def other_agency_old_pcr(other_agency, project_approved_status):
    return _create_old_pcr(other_agency, project_approved_status)


def _detail_url(old_pcr):
    return reverse("legacy-project-completion-report-detail", args=[old_pcr.id])


class TestMetaProjectLegacyPCR:
    client = APIClient()

    def _get_meta_project(self, meta_project):
        response = self.client.get(
            reverse("pcr-metaprojects-detail", args=[meta_project.id])
        )
        assert response.status_code == 200
        return response.data

    def test_has_pcr_flags(self, admin_user, agency, project_approved_status):
        no_pcr = _create_meta_project(agency, project_approved_status)
        with_pcr = _create_meta_project(agency, project_approved_status)
        PCRFactory(meta_project=with_pcr, submission_date="2026-08-08")
        old_pcr = _create_old_pcr(agency, project_approved_status)

        assert not no_pcr.has_pcr and not no_pcr.has_legacy_pcr
        assert with_pcr.has_pcr and not with_pcr.has_legacy_pcr
        assert old_pcr.meta_project.has_pcr and old_pcr.meta_project.has_legacy_pcr

        self.client.force_authenticate(user=admin_user)

        data = self._get_meta_project(no_pcr)
        assert data["has_pcr"] is False
        assert data["has_legacy_pcr"] is False
        assert data["legacy_pcr_id"] is None
        assert data["pcr_status"] is None
        assert data["pcr_submission_date"] is None

        data = self._get_meta_project(with_pcr)
        assert data["has_pcr"] is True
        assert data["has_legacy_pcr"] is False
        assert data["legacy_pcr_id"] is None
        assert data["pcr_status"] == PCR.Status.DRAFT
        assert data["pcr_submission_date"] == "2026-08-08"

        data = self._get_meta_project(old_pcr.meta_project)
        assert data["has_pcr"] is True
        assert data["has_legacy_pcr"] is True
        assert data["legacy_pcr_id"] == old_pcr.id
        assert data["pcr_id"] is None
        assert data["pcr_editable"] is None
        assert data["pcr_status"] == OLD_PCR._meta.get_field("status").default
        assert data["pcr_status"] == PCR.Status.FINAL
        assert data["pcr_submission_date"] == "2015-03-04"

    def test_pcr_status_filter(self, admin_user, agency, project_approved_status):
        with_pcr = _create_meta_project(agency, project_approved_status)
        PCRFactory(meta_project=with_pcr)
        old_pcr = _create_old_pcr(agency, project_approved_status)

        self.client.force_authenticate(user=admin_user)

        def get_ids(pcr_status):
            response = self.client.get(
                reverse("pcr-metaprojects-list"), {"pcr_status": pcr_status}
            )
            assert response.status_code == 200
            return {row["id"] for row in response.data}

        assert get_ids(PCR.Status.FINAL) == {old_pcr.meta_project_id}
        assert get_ids(PCR.Status.DRAFT) == {with_pcr.id}

        response = self.client.get(reverse("pcr-metaprojects-list-filters"))
        assert response.status_code == 200
        assert {status["id"] for status in response.data["pcr_status"]} == {
            PCR.Status.DRAFT,
            PCR.Status.FINAL,
        }


class TestOldPCRViewSet(BaseTest):

    @pytest.fixture(autouse=True)
    def setup(self, own_old_pcr):
        self.url = _detail_url(own_old_pcr)

    @staticmethod
    def _pcr_user(group_name, agency=None):
        user = UserFactory(agency=agency)
        user.groups.add(Group.objects.get(name=group_name))
        return user

    def test_retrieve(self, admin_user, own_old_pcr):
        self.client.force_authenticate(user=admin_user)
        response = self.client.get(self.url)
        assert response.status_code == 200
        data = response.data
        assert data["id"] == own_old_pcr.id
        assert data["meta_project_id"] == own_old_pcr.meta_project_id
        assert data["status"] == PCR.Status.FINAL
        assert data["submission_date"] == "2015-03-04"
        assert len(data["activities"]) == 2
        assert data["activities"][0]["sector_type"] == "Investment"
        assert len(data["delay_explanations"]) == 1
        assert len(data["learned_lessons"]) == 1

    def test_viewer_own_agency(self, agency, own_old_pcr, other_agency_old_pcr):
        self.client.force_authenticate(user=self._pcr_user("PCR - Viewer", agency))
        assert self.client.get(self.url).status_code == 200
        response = self.client.get(_detail_url(other_agency_old_pcr))
        assert response.status_code == 404

    def test_secretariat_all_agencies(self, other_agency_old_pcr):
        self.client.force_authenticate(user=self._pcr_user("PCR - Secretariat"))
        assert self.client.get(self.url).status_code == 200
        response = self.client.get(_detail_url(other_agency_old_pcr))
        assert response.status_code == 200

    def test_without_pcr_access(self, agency):
        self.client.force_authenticate(user=UserFactory(agency=agency))
        assert self.client.get(self.url).status_code == 403

    def test_read_only(self, admin_user):
        self.client.force_authenticate(user=admin_user)
        for method in ["put", "patch", "delete"]:
            response = getattr(self.client, method)(self.url, {}, format="json")
            assert response.status_code in (403, 405)
