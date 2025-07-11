import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from core.api.tests.base import (
    BaseProjectUtilityCreate,
    BaseProjectUtilityDelete,
)

from core.api.tests.factories import SubstanceFactory


pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221,R0913


@pytest.fixture(name="_project_ods_subst_create")
def project_ods_subst_create(project, substance):
    return {
        "project_id": project.id,
        "ods_substance_id": substance.id,
        "odp": 0.02,
        "ods_replacement": "N-are cine sa-mi ia locu",
    }


@pytest.fixture(name="_project_ods_blend_create")
def project_ods_blend_create(project, blend):
    return {
        "project_id": project.id,
        "ods_blend_id": blend.id,
        "odp": 0.02,
        "ods_replacement": "Ca ma iubeste norocu",
    }


class TestOdsOdpCreate(BaseProjectUtilityCreate):
    url = reverse("projectodsodp-list")
    proj_utility_attr_name = "ods_odp"

    @pytest.fixture(autouse=True)
    def setup(self, _project_ods_subst_create):
        self.__class__.new_utility_data = _project_ods_subst_create

    def test_ods_blend_create(
        self, secretariat_user, _project_ods_blend_create, project
    ):
        self.client.force_authenticate(user=secretariat_user)

        blend_ods_odp = _project_ods_blend_create

        # create ods blend
        response = self.client.post(self.url, blend_ods_odp, format="json")
        assert response.status_code == 201
        assert response.data["ods_blend_id"] == blend_ods_odp["ods_blend_id"]
        assert response.data["odp"] == blend_ods_odp["odp"]
        assert response.data["ods_replacement"] == blend_ods_odp["ods_replacement"]

        assert project.ods_odp.count() == 1

    def test_invalid_substance(self, secretariat_user, _project_ods_subst_create):
        self.client.force_authenticate(user=secretariat_user)

        subst_ods_odp = _project_ods_subst_create
        subst_ods_odp["ods_substance_id"] = 999

        response = self.client.post(self.url, subst_ods_odp, format="json")
        assert response.status_code == 400

    def test_subst_and_blend(self, secretariat_user, _project_ods_subst_create, blend):
        self.client.force_authenticate(user=secretariat_user)

        subst_ods_odp = _project_ods_subst_create
        subst_ods_odp["ods_blend_id"] = blend.id

        response = self.client.post(self.url, subst_ods_odp, format="json")
        assert response.status_code == 400


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

    def test_as_viewer(self, viewer_user, ods_subst_url):
        self.client.force_authenticate(user=viewer_user)

        response = self.client.patch(ods_subst_url, {"odp": 2.5})
        assert response.status_code == 403

    def test_patch(
        self, secretariat_user, ods_subst_url, project_ods_odp_subst, _setup_patch
    ):
        self.client.force_authenticate(user=secretariat_user)

        udpate_data = _setup_patch

        response = self.client.patch(ods_subst_url, _setup_patch)
        assert response.status_code == 200

        project_ods_odp_subst.refresh_from_db()
        assert project_ods_odp_subst.odp == udpate_data["odp"]
        assert project_ods_odp_subst.ods_substance_id == udpate_data["ods_substance_id"]

    def test_patch_subst_to_blend(
        self, secretariat_user, ods_subst_url, project_ods_odp_subst, blend
    ):
        # set ods blend wile ods substance is set
        self.client.force_authenticate(user=secretariat_user)
        response = self.client.patch(ods_subst_url, {"ods_blend_id": blend.id})
        assert response.status_code == 400

        project_ods_odp_subst.refresh_from_db()
        assert project_ods_odp_subst.ods_blend_id is None

    def test_patch_blend_to_subst(
        self, secretariat_user, ods_blend_url, project_ods_odp_blend, substance
    ):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.patch(ods_blend_url, {"ods_substance_id": substance.id})
        assert response.status_code == 400

        project_ods_odp_blend.refresh_from_db()
        assert project_ods_odp_blend.ods_substance_id is None

    def test_patch_invalid_substance(self, secretariat_user, ods_subst_url):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.patch(ods_subst_url, {"ods_substance_id": 999})
        assert response.status_code == 400

    def test_patch_invalid_blend(self, secretariat_user, ods_blend_url):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.patch(ods_blend_url, {"ods_blend_id": 999})
        assert response.status_code == 400


class TestProjectsOdsOdpDelete(BaseProjectUtilityDelete):
    @pytest.fixture(autouse=True)
    def setup(self, ods_subst_url):
        self.__class__.url = ods_subst_url
        self.__class__.proj_utility_attr_name = "ods_odp"
