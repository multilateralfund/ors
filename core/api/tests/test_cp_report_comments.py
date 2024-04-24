import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


class TestCPReportComments:
    client = APIClient()

    def test_without_permission_secretariat(self, user, cp_report_2019):
        url = reverse(
            "country-programme-report-comments", kwargs={"id": cp_report_2019.id}
        )

        # try to create country comment
        self.client.force_authenticate(user=user)
        data = {"section": "section_a", "comment_country": "Test create country"}
        response = self.client.post(url, data, format="json")
        assert response.status_code == 400

    def test_without_permission_country(self, country_user, cp_report_2019):
        url = reverse(
            "country-programme-report-comments", kwargs={"id": cp_report_2019.id}
        )

        # try to create secretariat comment
        self.client.force_authenticate(user=country_user)
        data = {
            "section": "section_a",
            "comment_secretariat": "Test create secretariat",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 400

    def test_create_comments(self, user, country_user, cp_report_2019):
        url = reverse(
            "country-programme-report-comments", kwargs={"id": cp_report_2019.id}
        )

        self.client.force_authenticate(user=country_user)
        # create section A country comment
        data = {"section": "section_a", "comment_country": "Test create country"}
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["comment_country_section_a"] == "Test create country"

        self.client.force_authenticate(user=user)
        # create section B secretariat comment
        data = {
            "section": "section_b",
            "comment_secretariat": "Test create secretariat",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert (
            response.data["comment_secretariat_section_b"] == "Test create secretariat"
        )

        # update section B secretariat comment
        data = {
            "section": "section_b",
            "comment_secretariat": "Test update secretariat",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert (
            response.data["comment_secretariat_section_b"] == "Test update secretariat"
        )

        # check same comments in get records
        url = reverse("country-programme-record-list")
        response = self.client.get(url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 200
        assert (
            response.data["cp_report"]["comment_country_section_a"]
            == "Test create country"
        )
        assert (
            response.data["cp_report"]["comment_secretariat_section_b"]
            == "Test update secretariat"
        )
