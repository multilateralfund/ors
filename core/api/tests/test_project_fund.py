import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.models.project import ProjectFund

pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221,R0913


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


class TestProjectsFundDelete:
    client = APIClient()

    def test_delete_anon(self, project_fund_url):
        response = self.client.delete(project_fund_url)
        assert response.status_code == 403

    def test_delete(self, user, project_fund_url, project):
        self.client.force_authenticate(user=user)

        response = self.client.delete(project_fund_url)
        assert response.status_code == 204

        assert not project.funds.exists()
