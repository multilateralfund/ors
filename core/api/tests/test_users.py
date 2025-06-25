import pytest

from django.contrib.auth.models import Permission
from django.urls import reverse

from core.api.tests.base import BaseTest

pytestmark = pytest.mark.django_db

# pylint: disable=R0913


class TestUserPermissions(BaseTest):
    url = reverse("user-permissions")

    def test_user_permissions(
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

        def _test_user_permissions(user, is_superuser=False):
            self.client.force_authenticate(user=user)
            response = self.client.get(self.url)
            assert response.status_code == 200
            if is_superuser:
                permissions = [obj.codename for obj in Permission.objects.all()]
            else:
                permissions = [
                    obj.codename
                    for obj in Permission.objects.filter(group__user=user).distinct()
                ]

            assert response.data == permissions

        # test with unauthenticated user
        response = self.client.get(self.url)
        assert response.status_code == 403

        # test with authenticated user
        _test_user_permissions(user)
        _test_user_permissions(viewer_user)
        _test_user_permissions(agency_user)
        _test_user_permissions(agency_inputter_user)
        _test_user_permissions(secretariat_viewer_user)
        _test_user_permissions(secretariat_v1_v2_edit_access_user)
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user)
        _test_user_permissions(secretariat_v3_edit_access_user)
        _test_user_permissions(secretariat_production_v3_edit_access_user)
        _test_user_permissions(admin_user, is_superuser=True)
