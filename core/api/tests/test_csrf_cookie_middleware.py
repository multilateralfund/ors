import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from core.models import AnnualAgencyProjectReport


@pytest.mark.django_db
class TestEnsureCsrfCookieMiddleware:
    """Regression test: a session cookie without a matching csrftoken cookie
    used to 403 APR writes with "CSRF cookie not set"."""

    def test_authenticated_get_issues_missing_csrf_cookie(self, mlfs_admin_user):
        client = APIClient(enforce_csrf_checks=True)
        client.force_login(mlfs_admin_user)
        assert "csrftoken" not in client.cookies

        response = client.get(reverse("apr-current-year"))

        assert response.status_code == status.HTTP_200_OK
        assert "csrftoken" in response.cookies

    def test_post_self_heals_after_an_authenticated_get(
        self, mlfs_admin_user, annual_agency_report
    ):
        annual_agency_report.status = (
            AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED
        )
        annual_agency_report.is_unlocked = False
        annual_agency_report.save()

        client = APIClient(enforce_csrf_checks=True)
        client.force_login(mlfs_admin_user)

        url = reverse(
            "apr-toggle-lock",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )

        # session with no csrftoken cookie yet -> write is rejected
        response = client.post(url, {"is_unlocked": True}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "CSRF" in response.data["detail"]

        # any authenticated GET self-heals the missing cookie
        client.get(reverse("apr-current-year"))
        csrf_token = client.cookies["csrftoken"].value

        response = client.post(
            url,
            {"is_unlocked": True},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_unlocked"] is True
