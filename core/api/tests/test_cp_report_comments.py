import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


class TestCPReportComments:
    client = APIClient()
    SECTION_A = "section_a"
    SECTION_B = "section_b"
    COMMENT_COUNTRY = "comment_country"
    COMMENT_SECRETARIAT = "comment_secretariat"

    def test_without_permission_secretariat(self, user, cp_report_2019):
        url = reverse(
            "country-programme-report-comments", kwargs={"id": cp_report_2019.id}
        )

        # try to create country comment
        self.client.force_authenticate(user=user)
        data = {
            "section": self.SECTION_A,
            "comment_type": self.COMMENT_COUNTRY,
            "comment": "Test create country",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 400

    def test_without_permission_country(self, country_user, cp_report_2019):
        url = reverse(
            "country-programme-report-comments", kwargs={"id": cp_report_2019.id}
        )

        # try to create secretariat comment
        self.client.force_authenticate(user=country_user)
        data = {
            "section": self.SECTION_A,
            "comment_type": self.COMMENT_SECRETARIAT,
            "comment": "Test create secretariat",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 400

    def test_create_comments(self, user, country_user, cp_report_2019):
        url = reverse(
            "country-programme-report-comments", kwargs={"id": cp_report_2019.id}
        )

        self.client.force_authenticate(user=country_user)
        # create section A country comment
        data = {
            "section": self.SECTION_A,
            "comment_type": self.COMMENT_COUNTRY,
            "comment": "Test create country",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["section"] == self.SECTION_A
        assert response.data["comment_type"] == self.COMMENT_COUNTRY
        assert response.data["comment"] == "Test create country"

        self.client.force_authenticate(user=user)
        # create section B secretariat comment
        data = {
            "section": self.SECTION_B,
            "comment_type": self.COMMENT_SECRETARIAT,
            "comment": "Test create secretariat",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["section"] == self.SECTION_B
        assert response.data["comment_type"] == self.COMMENT_SECRETARIAT
        assert response.data["comment"] == "Test create secretariat"

        # update section B secretariat comment
        data = {
            "section": self.SECTION_B,
            "comment_type": self.COMMENT_SECRETARIAT,
            "comment": "Test update secretariat",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["section"] == self.SECTION_B
        assert response.data["comment_type"] == self.COMMENT_SECRETARIAT
        assert response.data["comment"] == "Test update secretariat"

        # check same comments in get records
        url = reverse("country-programme-record-list")
        response = self.client.get(url, {"cp_report_id": cp_report_2019.id})
        assert response.data["comments"][0]["section"] == self.SECTION_A
        assert response.data["comments"][0]["comment_type"] == self.COMMENT_COUNTRY
        assert response.data["comments"][0]["comment"] == "Test create country"

        assert response.status_code == 200
        assert response.data["comments"][1]["section"] == self.SECTION_B
        assert response.data["comments"][1]["comment_type"] == self.COMMENT_SECRETARIAT
        assert response.data["comments"][1]["comment"] == "Test update secretariat"
