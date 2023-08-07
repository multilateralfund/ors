import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.factories import SubstanceFactory


pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221,R0913


@pytest.fixture(name="ods_subst_url")
def peoject_ods_subst_url(project_ods_odp_subst):
    return reverse("projectodsodp-detail", args=(project_ods_odp_subst.id,))


@pytest.fixture(name="ods_blend_url")
def peoject_ods_blend_url(project_ods_odp_blend):
    return reverse("projectodsodp-detail", args=(project_ods_odp_blend.id,))


@pytest.fixture(name="_setup_patch")
def setup_patch(groupA):
    another_substance = SubstanceFactory.create(
        name="anothersubstance",
        group=groupA,
        odp=0.02,
        gwp=0.05,
    )
    return {
        "ods_substance_id": another_substance.id,
        "odp": 2.5,
    }


class TestProjectsOdsOdpUpdate:
    client = APIClient()

    def test_patch_anon(self, ods_subst_url):
        response = self.client.patch(ods_subst_url, {"odp": 2.5})
        assert response.status_code == 403

    def test_patch(self, user, ods_subst_url, project_ods_odp_subst, _setup_patch):
        self.client.force_authenticate(user=user)

        udpate_data = _setup_patch

        response = self.client.patch(ods_subst_url, _setup_patch)
        assert response.status_code == 200

        project_ods_odp_subst.refresh_from_db()
        assert project_ods_odp_subst.odp == udpate_data["odp"]
        assert project_ods_odp_subst.ods_substance_id == udpate_data["ods_substance_id"]

    def test_patch_subst_to_blend(
        self, user, ods_subst_url, project_ods_odp_subst, blend
    ):
        # set ods blend wile ods substance is set
        self.client.force_authenticate(user=user)
        response = self.client.patch(ods_subst_url, {"ods_blend_id": blend.id})
        assert response.status_code == 400

        project_ods_odp_subst.refresh_from_db()
        assert project_ods_odp_subst.ods_blend_id is None

    def test_patch_blend_to_subst(
        self, user, ods_blend_url, project_ods_odp_blend, substance
    ):
        self.client.force_authenticate(user=user)

        response = self.client.patch(ods_blend_url, {"ods_substance_id": substance.id})
        assert response.status_code == 400

        project_ods_odp_blend.refresh_from_db()
        assert project_ods_odp_blend.ods_substance_id is None

    def test_patch_invalid_substance(self, user, ods_subst_url):
        self.client.force_authenticate(user=user)

        response = self.client.patch(ods_subst_url, {"ods_substance_id": 999})
        assert response.status_code == 400

    def test_patch_invalid_blend(self, user, ods_blend_url):
        self.client.force_authenticate(user=user)

        response = self.client.patch(ods_blend_url, {"ods_blend_id": 999})
        assert response.status_code == 400


class TestProjectsOdsOdpDelete:
    client = APIClient()

    def test_delete_anon(self, ods_subst_url):
        response = self.client.delete(ods_subst_url)
        assert response.status_code == 403

    def test_delete(self, user, ods_subst_url, project):
        self.client.force_authenticate(user=user)

        response = self.client.delete(ods_subst_url)
        assert response.status_code == 204

        project.refresh_from_db()
        assert not project.ods_odp.exists()
