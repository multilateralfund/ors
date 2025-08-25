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
        assert len(config.CP_NOTIFICATION_EMAILS) == 0

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


class TestProjectSettings(BaseTest):
    url = reverse("project-settings")

    def test_permissions(
        self,
        user,
        viewer_user,
        agency_user,
        agency_inputter_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        mlfs_admin_user,
        admin_user,
    ):
        def _test_user_permissions(
            user, expected_get_response_status, expected_post_response_status
        ):
            self.client.force_authenticate(user=user)
            response = self.client.get(self.url)
            assert response.status_code == expected_get_response_status
            response = self.client.post(self.url, {})
            assert response.status_code == expected_post_response_status

        _test_user_permissions(user, 403, 403)
        _test_user_permissions(viewer_user, 403, 403)
        _test_user_permissions(agency_user, 403, 403)
        _test_user_permissions(agency_inputter_user, 403, 403)
        _test_user_permissions(secretariat_viewer_user, 403, 403)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 403, 403)
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 403, 403)
        _test_user_permissions(secretariat_v3_edit_access_user, 403, 403)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 403, 403)
        _test_user_permissions(mlfs_admin_user, 200, 200)
        _test_user_permissions(admin_user, 200, 200)

    def test_get_settings(self, mlfs_admin_user):
        self.client.force_authenticate(user=mlfs_admin_user)

        response = self.client.get(self.url)
        assert response.status_code == 200

    def test_update_settings(self, mlfs_admin_user):
        self.client.force_authenticate(user=mlfs_admin_user)
        assert config.PROJECT_SUBMISSION_NOTIFICATIONS_ENABLED is False
        assert config.PROJECT_SUBMISSION_NOTIFICATIONS_EMAILS == ""
        assert config.PROJECT_RECOMMENDATION_NOTIFICATIONS_ENABLED is False
        assert config.PROJECT_RECOMMENDATION_NOTIFICATIONS_EMAILS == ""

        data = {
            "project_submission_notifications_enabled": True,
            "project_submission_notifications_emails": "test@ors.org,test2@ors.org",
            "project_recommendation_notifications_enabled": True,
            "project_recommendation_notifications_emails": "test2@ors.org,test3@ors.org",
        }
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 200
        assert config.PROJECT_SUBMISSION_NOTIFICATIONS_ENABLED is True
        assert config.PROJECT_RECOMMENDATION_NOTIFICATIONS_ENABLED is True
        assert (
            config.PROJECT_SUBMISSION_NOTIFICATIONS_EMAILS
            == "test@ors.org,test2@ors.org"
        )
        assert (
            config.PROJECT_RECOMMENDATION_NOTIFICATIONS_EMAILS
            == "test2@ors.org,test3@ors.org"
        )
