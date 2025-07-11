import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from core.api.tests.base import BaseProjectUtilityCreate, BaseProjectUtilityDelete

pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221,R0913


@pytest.fixture(name="_create_proj_rbm_measure")
def create_proj_rbm_measure(project, rbm_measure):
    return {
        "project_id": project.id,
        "measure_id": rbm_measure.id,
        "value": 42,
    }


class TestCreateSubAmount(BaseProjectUtilityCreate):
    url = reverse("projectrbmmeasure-list")
    proj_utility_attr_name = "rbm_measures"

    @pytest.fixture(autouse=True)
    def setup(self, _create_proj_rbm_measure):
        self.__class__.new_utility_data = _create_proj_rbm_measure

    def test_invalid_measure(self, secretariat_user, _create_proj_rbm_measure):
        self.client.force_authenticate(user=secretariat_user)

        project_data = _create_proj_rbm_measure
        project_data["measure_id"] = 999
        response = self.client.post(self.url, project_data, format="json")
        assert response.status_code == 400


@pytest.fixture(name="proj_rbm_measure_url")
def _proj_rbm_measure_url(project_rbm_measure):
    return reverse("projectrbmmeasure-detail", args=(project_rbm_measure.id,))


class TestSubmissionAmountUpdate:
    client = APIClient()

    def test_update_anon(self, proj_rbm_measure_url):
        response = self.client.patch(proj_rbm_measure_url, {"value": 41})
        assert response.status_code == 403

    def test_as_viewer(self, viewer_user, proj_rbm_measure_url):
        self.client.force_authenticate(user=viewer_user)

        response = self.client.patch(proj_rbm_measure_url, {"value": 41})
        assert response.status_code == 403

    def test_update(self, secretariat_user, proj_rbm_measure_url, project_rbm_measure):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.patch(proj_rbm_measure_url, {"value": 41})
        assert response.status_code == 200

        project_rbm_measure.refresh_from_db()
        assert project_rbm_measure.value == 41

    def test_invalid_measure(self, secretariat_user, proj_rbm_measure_url):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.patch(proj_rbm_measure_url, {"measure_id": 999})
        assert response.status_code == 400


class TestSubmissionAmountDelete(BaseProjectUtilityDelete):
    @pytest.fixture(autouse=True)
    def setup(self, proj_rbm_measure_url):
        self.__class__.url = proj_rbm_measure_url
        self.__class__.proj_utility_attr_name = "rbm_measures"
