import pytest
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import Permission
from django.urls import reverse
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken

from core.api.tests.factories import UserFactory
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
            assert response.status_code == status.HTTP_200_OK
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


class TestCustomTokenLifetime:
    """
    Tests for custom JWT token lifetime based on user type
    """

    # Tolerance (in seconds) for token lifetime comparisons
    token_lifetime_tolerance = 60

    def test_regular_user_token_lifetime(self, client):
        """Regular users should get 4-hour tokens"""
        user = UserFactory.create(username="regular_user", is_external_service=False)
        user.set_password("testpass123")
        user.save()

        response = client.post(
            reverse("rest_login"),
            {"username": "regular_user", "password": "testpass123"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.data

        token_str = response.data.get("access_token")
        token = AccessToken(token_str)

        exp_timestamp = token.payload["exp"]
        iat_timestamp = token.payload["iat"]
        lifetime_seconds = exp_timestamp - iat_timestamp

        # Should be around 4 hours (with some tolerance)
        expected_lifetime = timedelta(hours=4).total_seconds()
        assert abs(lifetime_seconds - expected_lifetime) < self.token_lifetime_tolerance

    def test_external_service_user_token_lifetime(self, client):
        user = UserFactory.create(
            username="external_service",
            is_external_service=True,
        )
        user.set_password("testpass123")
        user.save()

        response = client.post(
            reverse("rest_login"),
            {"username": "external_service", "password": "testpass123"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.data

        token_str = response.data.get("access_token")
        token = AccessToken(token_str)

        exp_timestamp = token.payload["exp"]
        iat_timestamp = token.payload["iat"]
        lifetime_seconds = exp_timestamp - iat_timestamp

        # Should be around EXTERNAL_USERS_TOKEN_EXIPIRY_DAYS (with a bit of tolerance)
        expected_lifetime = timedelta(
            days=settings.EXTERNAL_USERS_TOKEN_EXIPIRY_DAYS
        ).total_seconds()
        assert abs(lifetime_seconds - expected_lifetime) < self.token_lifetime_tolerance
