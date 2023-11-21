import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from core.api.tests.base import (
    BaseProjectUtilityCreate,
    BaseProjectUtilityDelete,
)

from core.models.project import ProjectFund

pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221,R0913


@pytest.fixture(name="_create_project_fund")
def create_project_fund(project, meeting):
    return {
        "project_id": project.id,
        "fund_type": ProjectFund.FundType.ALLOCATED,
        "amount": 42,
        "meeting_id": meeting.id,
    }


class TestCreateProjectFund(BaseProjectUtilityCreate):
    url = reverse("projectfund-list")
    proj_utility_attr_name = "funds"

    @pytest.fixture(autouse=True)
    def setup(self, _create_project_fund):
        self.__class__.new_utility_data = _create_project_fund

    def test_invalid_meeting(self, user, _create_project_fund, project):
        self.client.force_authenticate(user=user)

        project_data = _create_project_fund
        project_data["meeting_id"] = 999
        response = self.client.post(self.url, project_data, format="json")
        assert response.status_code == 400


@pytest.fixture(name="project_fund")
def _project_fund(project):
    return ProjectFund.objects.create(
        project=project, fund_type=ProjectFund.FundType.ALLOCATED, amount=42
    )


@pytest.fixture(name="project_fund_url")
def _project_fund_url(project_fund):
    return reverse("projectfund-detail", args=(project_fund.id,))


class TestFundUpdate:
    client = APIClient()

    def test_update_anon(self, project_fund_url):
        response = self.client.patch(project_fund_url)
        assert response.status_code == 403

    def test_update(self, user, project_fund_url, project_fund):
        self.client.force_authenticate(user=user)

        response = self.client.patch(project_fund_url, {"amount": 41})
        assert response.status_code == 200

        project_fund.refresh_from_db()
        assert project_fund.amount == 41


class TestProjectsFundDelete(BaseProjectUtilityDelete):
    @pytest.fixture(autouse=True)
    def setup(self, project_fund_url):
        self.__class__.url = project_fund_url
        self.__class__.proj_utility_attr_name = "funds"
