import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.models.country_programme import CPHistory, CPReport

pytestmark = pytest.mark.django_db


@pytest.fixture(name="_setup_new_cp_report_create")
def setup_new_cp_report_create(country_ro):
    return {
        "country_id": country_ro.id,
        "name": "Romania2023",
        "year": 2023,
        "status": CPReport.CPReportStatus.FINAL,
        "section_a": [],
        "section_b": [],
        "section_c": [],
        "section_d": [],
        "section_e": [],
        "section_f": {},
    }


class TestCPHistory:
    client = APIClient()

    def test_create_history(self, user, second_user, _setup_new_cp_report_create):
        # create new cp report
        self.client.force_authenticate(user=user)
        url = reverse("country-programme-reports")
        response = self.client.post(url, _setup_new_cp_report_create, format="json")
        assert response.status_code == 201
        cp_report_id = response.data["id"]

        # add comment
        url = reverse("country-programme-report-comments", kwargs={"id": cp_report_id})
        response = self.client.post(
            url,
            {"comment_secretariat": "Test comment"},
            format="json",
        )
        assert response.status_code == 201

        # update cp report
        self.client.force_authenticate(user=second_user)
        url = reverse("country-programme-reports") + f"{cp_report_id}/"
        data = _setup_new_cp_report_create
        data["name"] = "Test update"

        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data["id"]

        # add other comment
        url = reverse("country-programme-report-comments", kwargs={"id": new_id})
        response = self.client.post(
            url,
            {"comment_secretariat": "Test comment 2"},
            format="json",
        )
        assert response.status_code == 201

        # check 4 history objects created
        history = CPHistory.objects.filter(country_programme_report_id=new_id)
        assert history.count() == 4

        assert history[3].updated_by.username == user.username
        assert "created by user" in history[3].event_description.lower()
        assert history[3].report_version == 1

        assert history[2].updated_by.username == user.username
        assert "comments updated" in history[2].event_description.lower()
        assert history[2].report_version == 1

        assert history[1].updated_by.username == second_user.username
        assert "updated by user" in history[1].event_description.lower()
        assert history[1].report_version == 2

        assert history[0].updated_by.username == second_user.username
        assert "comments updated" in history[0].event_description.lower()
        assert history[0].report_version == 2

        # check history in API response
        url = reverse("country-programme-record-list")
        response = self.client.get(url, {"cp_report_id": new_id})
        assert response.status_code == 200

        # check same 4 history items in get records
        history = response.data["history"]
        assert len(history) == 4

        assert history[3]["updated_by_username"] == user.username
        assert "created by user" in history[3]["event_description"].lower()
        assert history[3]["report_version"] == 1

        assert history[2]["updated_by_username"] == user.username
        assert "comments updated" in history[2]["event_description"].lower()
        assert history[2]["report_version"] == 1

        assert history[1]["updated_by_username"] == second_user.username
        assert "updated by user" in history[1]["event_description"].lower()
        assert history[1]["report_version"] == 2

        assert history[0]["updated_by_username"] == second_user.username
        assert "comments updated" in history[0]["event_description"].lower()
        assert history[0]["report_version"] == 2
