import pytest
from constance import config
from django.urls import reverse

from core.api.tests.base import BaseTest


pytestmark = pytest.mark.django_db
# pylint: disable=C8008


class TestSettings(BaseTest):
    url = reverse("settings")

    def test_get_settings(self, viewer_user):
        self.client.force_authenticate(user=viewer_user)

        response = self.client.get(self.url)
        assert response.status_code == 200

    def test_update_settings(self, user):
        self.client.force_authenticate(user=user)
        assert config.SEND_MAIL is True
        assert len(config.CP_NOTIFICATION_EMAILS) is 0

        data = {
            "send_mail": False,
            "cp_notification_emails": "test@ors.org,test2@ors.org",
        }
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 200
        assert config.SEND_MAIL is False
        assert set(config.CP_NOTIFICATION_EMAILS) == set(
            ["test@ors.org", "test2@ors.org"]
        )
