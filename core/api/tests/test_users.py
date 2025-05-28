import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest


pytestmark = pytest.mark.django_db

# pylint: disable=R0913


class TestUserPermissions(BaseTest):
    url = reverse("user-permissions")

    def test_projest_list_permissions(
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
        admin_user,
    ):

        def _test_user_permissions(user, expected_response):
            self.client.force_authenticate(user=user)
            response = self.client.get(self.url)
            assert response.status_code == 200
            assert response.data == expected_response

        # test with unauthenticated user
        response = self.client.get(self.url)
        assert response.status_code == 403

        # test with authenticated user
        _test_user_permissions(user, [])
        _test_user_permissions(viewer_user, ["view_project"])
        _test_user_permissions(
            agency_user,
            [
                "add_project",
                "edit_project",
                "increase_project_version",
                "submit_project",
                "view_project",
            ],
        )
        _test_user_permissions(
            agency_inputter_user,
            ["add_project", "edit_project", "view_project"],
        )
        _test_user_permissions(secretariat_viewer_user, ["view_project"])
        _test_user_permissions(
            secretariat_v1_v2_edit_access_user,
            [
                "add_project",
                "edit_project",
                "increase_project_version",
                "send_project_back_to_draft",
                "submit_project",
                "view_project",
                "withdraw_project",
            ],
        )
        _test_user_permissions(
            secretariat_production_v1_v2_edit_access_user,
            [
                "add_project",
                "edit_project",
                "increase_project_version",
                "send_project_back_to_draft",
                "submit_project",
                "view_project",
                "withdraw_project",
            ],
        )
        _test_user_permissions(
            secretariat_v3_edit_access_user,
            ["add_project", "edit_project", "view_project"],
        )
        _test_user_permissions(
            secretariat_production_v3_edit_access_user,
            ["add_project", "edit_project", "view_project"],
        )
        _test_user_permissions(
            admin_user,
            [
                "add_project",
                "edit_project",
                "increase_project_version",
                "submit_project",
                "view_project",
            ],
        )
