import pytest
from constance import config
from django.urls import reverse
from rest_framework.test import APIClient
from unittest.mock import patch

pytestmark = pytest.mark.django_db


@pytest.fixture(name="mock_send_mail_comment")
def _mock_send_mail_comment():
    with patch("core.tasks.send_mail_comment_submit_bp.delay") as send_mail:
        yield send_mail


class TestBPComments:
    client = APIClient()
    COMMENT_AGENCY = "comment_agency"
    COMMENT_SECRETARIAT = "comment_secretariat"

    def test_without_permission_secretariat(self, user, bp_record):
        url = reverse("business-plan-comments", kwargs={"id": bp_record.id})

        # try to create agency comment
        self.client.force_authenticate(user=user)
        data = {
            "comment_type": self.COMMENT_AGENCY,
            "comment": "Test create agency",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 400

    def test_without_permission_agency(self, agency_user, bp_record):
        url = reverse("business-plan-comments", kwargs={"id": bp_record.id})

        # try to create secretariat comment
        self.client.force_authenticate(user=agency_user)
        data = {
            "comment_type": self.COMMENT_SECRETARIAT,
            "comment": "Test create secretariat",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 400

    def test_create_comments(
        self, user, agency_user, bp_record, mock_send_mail_comment
    ):
        url = reverse("business-plan-comments", kwargs={"id": bp_record.id})

        self.client.force_authenticate(user=agency_user)
        # create agency comment
        data = {
            "comment_type": self.COMMENT_AGENCY,
            "comment": "Test create agency",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["comment_agency"] == "Test create agency"

        self.client.force_authenticate(user=user)
        # create secretariat comment
        data = {
            "comment_type": self.COMMENT_SECRETARIAT,
            "comment": "Test create secretariat",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["comment_secretariat"] == "Test create secretariat"

        # update secretariat comment
        data = {
            "comment_type": self.COMMENT_SECRETARIAT,
            "comment": "Test update secretariat",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["comment_secretariat"] == "Test update secretariat"

        url = reverse("bprecord-list") + f"{bp_record.id}/"
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data["comment_agency"] == "Test create agency"
        assert response.data["comment_secretariat"] == "Test update secretariat"

        # check 3 emails sent (3 comments)
        mock_send_mail_comment.assert_called()
        assert mock_send_mail_comment.call_count == 3

    def test_config_mail_not_sent(self, user, bp_record, mock_send_mail_comment):
        config.SEND_MAIL = False  # change config
        url = reverse("business-plan-comments", kwargs={"id": bp_record.id})

        self.client.force_authenticate(user=user)
        # create  comment
        data = {
            "comment_type": self.COMMENT_SECRETARIAT,
            "comment": "Test config - mail not sent",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201

        # check email not sent
        mock_send_mail_comment.assert_not_called()
