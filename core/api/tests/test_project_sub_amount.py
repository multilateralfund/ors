import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from core.api.tests.base import (
    BaseProjectUtilityCreate,
    BaseProjectUtilityDelete,
)
from core.api.tests.factories import SubmissionAmountFactory

from core.models.project import SubmissionAmount

pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221,R0913


@pytest.fixture(name="_create_sub_amount")
def create_sub_amount(project):
    return {
        "project_id": project.id,
        "status": SubmissionAmount.SubmissionStatus.REQUESTED,
        "amount": 42,
        "impact": 12.3,
    }


class TestCreateSubAmount(BaseProjectUtilityCreate):
    url = reverse("submissionamount-list")
    proj_utility_attr_name = "submission_amounts"

    @pytest.fixture(autouse=True)
    def setup(self, _create_sub_amount):
        self.__class__.new_utility_data = _create_sub_amount


@pytest.fixture(name="_sub_amount")
def sub_amount(project):
    return SubmissionAmountFactory(project=project, amount=42)


@pytest.fixture(name="_sub_amount_url")
def sub_amount_url(_sub_amount):
    return reverse("submissionamount-detail", args=(_sub_amount.id,))


class TestSubmissionAmountUpdate:
    client = APIClient()

    def test_update_anon(self, _sub_amount_url):
        response = self.client.patch(_sub_amount_url)
        assert response.status_code == 403

    def test_as_viewer(self, viewer_user, _sub_amount_url):
        self.client.force_authenticate(user=viewer_user)

        response = self.client.patch(_sub_amount_url)
        assert response.status_code == 403

    def test_update(self, user, _sub_amount_url, _sub_amount):
        self.client.force_authenticate(user=user)

        response = self.client.patch(_sub_amount_url, {"amount": 41})
        assert response.status_code == 200

        _sub_amount.refresh_from_db()
        assert _sub_amount.amount == 41


class TestSubmissionAmountDelete(BaseProjectUtilityDelete):
    @pytest.fixture(autouse=True)
    def setup(self, _sub_amount_url):
        self.__class__.url = _sub_amount_url
        self.__class__.proj_utility_attr_name = "submission_amounts"
