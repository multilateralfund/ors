import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from unittest.mock import patch

from core.models.country_programme import CPHistory, CPReport

pytestmark = pytest.mark.django_db


@pytest.fixture(name="_setup_new_cp_report_create")
def setup_new_cp_report_create(country_ro):
    return {
        "country_id": country_ro.id,
        "name": "Romania2023",
        "year": 2023,
        "status": CPReport.CPReportStatus.DRAFT,
        "section_a": [],
        "section_b": [],
        "section_c": [],
        "section_d": [],
        "section_e": [],
        "section_f": {},
    }


@pytest.fixture(name="mock_send_mail_report_create")
def _mock_send_mail_report_create():
    with patch("core.tasks.send_mail_report_create.delay") as send_mail:
        yield send_mail


@pytest.fixture(name="mock_send_mail_report_update")
def _mock_send_mail_report_update():
    with patch("core.tasks.send_mail_report_update.delay") as send_mail:
        yield send_mail


@pytest.fixture(name="mock_send_mail_comment")
def _mock_send_mail_comment():
    with patch("core.tasks.send_mail_comment_submit.delay") as send_mail:
        yield send_mail


# pylint: disable=W0613
class TestCPHistory:
    client = APIClient()

    def test_create_history(
        self,
        secretariat_user,
        second_user,
        _setup_new_cp_report_create,
        mock_send_mail_report_create,
        mock_send_mail_report_update,
        mock_send_mail_comment,
    ):
        VALIDATION_LIST_FULL_HISTORY = [
            ("created by user", 5, 1, secretariat_user.username),
            ("comments updated", 4, 1, secretariat_user.username),
            ("updated by user", 3, 1, second_user.username),
            ("status changed", 2, 1, second_user.username),
            ("comments updated", 1, 1, second_user.username),
            ("updated by user", 0, 2, second_user.username),
        ]
        VALIDATION_LIST = [
            ("updated by user", 2, 1, second_user.username),
            ("comments updated", 1, 1, second_user.username),
            ("updated by user", 0, 2, second_user.username),
        ]  # status changed event hidden

        # create new cp report
        self.client.force_authenticate(user=secretariat_user)
        url = reverse("country-programme-reports")
        response = self.client.post(url, _setup_new_cp_report_create, format="json")
        assert response.status_code == 201
        cp_report_id = response.data["id"]

        # add comment
        url = reverse("country-programme-report-comments", kwargs={"id": cp_report_id})
        response = self.client.post(
            url,
            {
                "section": "section_a",
                "comment_type": "comment_secretariat",
                "comment": "Test comment",
            },
            format="json",
        )
        assert response.status_code == 201

        # update cp report ( 2 history record = update status + update report)
        self.client.force_authenticate(user=second_user)
        url = reverse("country-programme-reports") + f"{cp_report_id}/"
        data = _setup_new_cp_report_create
        data["name"] = "Test update"
        data["status"] = CPReport.CPReportStatus.FINAL

        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data["id"]

        # add other comment
        url = reverse("country-programme-report-comments", kwargs={"id": new_id})
        response = self.client.post(
            url,
            {
                "section": "section_a",
                "comment_type": "comment_secretariat",
                "comment": "Test comment 2",
            },
            format="json",
        )
        assert response.status_code == 201

        # update again as final
        data["name"] = "Test update2"
        url = reverse("country-programme-reports") + f"{new_id}/"

        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data["id"]

        # check 6 history objects created
        history = CPHistory.objects.filter(country_programme_report_id=new_id)
        assert history.count() == len(VALIDATION_LIST_FULL_HISTORY)

        for valid_string, i, version, req_user in VALIDATION_LIST_FULL_HISTORY:
            assert history[i].updated_by.username == req_user
            assert valid_string in history[i].event_description.lower()
            assert history[i].report_version == version

        # check history in API response
        url = reverse("country-programme-record-list")
        for full_history, valid_list in [
            (1, VALIDATION_LIST_FULL_HISTORY),
            (0, VALIDATION_LIST),
        ]:
            response = self.client.get(
                url, {"cp_report_id": new_id, "full_history": full_history}
            )
            assert response.status_code == 200

            # check history items in get records
            history = response.data["history"]
            assert len(history) == len(valid_list)

            for valid_string, i, version, req_user in valid_list:
                assert history[i]["updated_by_username"] == req_user
                assert valid_string in history[i]["event_description"].lower()
                assert history[i]["report_version"] == version
