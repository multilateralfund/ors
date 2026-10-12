"""Unauthenticated document navigations return to login, not raw DRF errors."""

from datetime import timedelta
from types import SimpleNamespace
from urllib.parse import parse_qs, urlsplit

import pytest
from django.conf import settings
from django.test import override_settings
from django.urls import reverse
from rest_framework import exceptions
from rest_framework.request import Request
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework_simplejwt.tokens import AccessToken

from core.api.auth_redirect import login_redirect_exception_handler


@override_settings(FRONTEND_HOST=["https://frontend.example"])
def test_document_navigation_redirects_when_cookie_is_missing():
    client = APIClient()
    response = client.get(
        reverse("rest_user_details") + "?project_id=44063&output_format=docx",
        HTTP_SEC_FETCH_MODE="navigate",
        HTTP_ACCEPT="text/html",
    )
    assert response.status_code == 302
    url = urlsplit(response["Location"])
    assert (url.scheme, url.netloc, url.path) == (
        "https",
        "frontend.example",
        "/login",
    )
    assert parse_qs(url.query)["redirect"] == [
        "/api/auth/user/?project_id=44063&output_format=docx"
    ]
    assert response["Cache-Control"] == "no-store"


@override_settings(FRONTEND_HOST=["https://frontend.example"])
def test_invalid_token_redirects_to_login():
    request = APIRequestFactory().get(
        "/api/projects/v2/export/?project_id=44063",
        HTTP_SEC_FETCH_MODE="navigate",
    )
    drf_request = Request(request)
    drf_request.user = SimpleNamespace(is_authenticated=False)
    result = login_redirect_exception_handler(
        exceptions.AuthenticationFailed("Token is invalid or expired"),
        {"request": drf_request},
    )
    assert result.status_code == 302
    assert (
        "redirect=%2Fapi%2Fprojects%2Fv2%2Fexport%2F%3Fproject_id%3D44063"
        in result["Location"]
    )


@override_settings(
    FRONTEND_HOST=["https://frontend.example"],
    REST_FRAMEWORK={
        **settings.REST_FRAMEWORK,
        "DEFAULT_AUTHENTICATION_CLASSES": (
            "rest_framework.authentication.SessionAuthentication",
            "core.auth.SmartTokenAuthentication",
        ),
    },
)
def test_expired_jwt_cookie_redirects_on_navigation_but_not_api_fetch():
    access = AccessToken()
    access["user_id"] = 123
    access.set_exp(lifetime=timedelta(seconds=-1))
    client = APIClient()
    client.cookies["orsauth"] = str(access)

    navigation = client.get(
        reverse("rest_user_details"),
        HTTP_SEC_FETCH_MODE="navigate",
        HTTP_ACCEPT="text/html",
    )
    assert navigation.status_code == 302
    assert navigation["Location"].startswith("https://frontend.example/login?")

    api_response = client.get(
        reverse("rest_user_details"), HTTP_ACCEPT="application/json"
    )
    assert api_response.status_code in (401, 403)
    assert "Location" not in api_response


@override_settings(FRONTEND_HOST=["https://frontend.example"])
def test_project_export_navigation_redirects_before_exporting():
    response = APIClient().get(
        "/api/projects/v2/export/?project_id=44063&output_format=docx",
        HTTP_SEC_FETCH_MODE="navigate",
        HTTP_ACCEPT="text/html",
    )
    assert response.status_code == 302
    assert parse_qs(urlsplit(response["Location"]).query)["redirect"] == [
        "/api/projects/v2/export/?project_id=44063&output_format=docx"
    ]


def test_api_fetch_does_not_redirect():
    client = APIClient()
    for accept, mode in (
        ("application/json", "cors"),
        ("*/*", "cors"),
        ("text/html", "cors"),
    ):
        response = client.get(
            reverse("rest_user_details"),
            HTTP_ACCEPT=accept,
            HTTP_SEC_FETCH_MODE=mode,
        )
        assert response.status_code in (401, 403)
        assert "Location" not in response


def test_html_navigation_without_fetch_metadata_redirects():
    response = APIClient().get(reverse("rest_user_details"), HTTP_ACCEPT="text/html")
    assert response.status_code == 302


@pytest.mark.parametrize("authenticated", [False, True])
def test_permission_denial_only_redirects_when_anonymous(authenticated):
    request = APIRequestFactory().get(
        "/api/projects/v2/export/?project_id=44063",
        HTTP_SEC_FETCH_MODE="navigate",
        HTTP_ACCEPT="text/html",
    )
    drf_request = Request(request)
    drf_request.user = SimpleNamespace(is_authenticated=authenticated)
    result = login_redirect_exception_handler(
        exceptions.PermissionDenied(), {"request": drf_request}
    )
    assert result.status_code == (403 if authenticated else 302)


def test_post_cannot_be_redirected():
    request = APIRequestFactory().post(
        "/api/projects/v2/export/", HTTP_SEC_FETCH_MODE="navigate"
    )
    result = login_redirect_exception_handler(
        exceptions.NotAuthenticated(), {"request": Request(request)}
    )
    assert result.status_code in (401, 403)
    assert "Location" not in result
