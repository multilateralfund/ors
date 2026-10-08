"""Send unauthenticated browser navigations through the frontend login flow."""

from urllib.parse import urlencode

from django.conf import settings
from django.http import HttpResponseRedirect
from rest_framework import exceptions
from rest_framework.views import exception_handler as default_exception_handler


def login_redirect_exception_handler(exc, context):
    """Redirect document GETs only; keep API errors and permission denials intact."""
    request = context["request"]
    fetch_mode = request.META.get("HTTP_SEC_FETCH_MODE")
    is_navigation = fetch_mode == "navigate" or (
        not fetch_mode and "text/html" in request.META.get("HTTP_ACCEPT", "")
    )
    if (
        request.method == "GET"
        and request.path.startswith("/api/")
        and is_navigation
        and isinstance(
            exc,
            (
                exceptions.NotAuthenticated,
                exceptions.AuthenticationFailed,
                exceptions.PermissionDenied,
            ),
        )
        and not request.user.is_authenticated
    ):
        login_url = settings.FRONTEND_HOST[0].rstrip("/") + "/login"
        response = HttpResponseRedirect(
            f"{login_url}?{urlencode({'redirect': request.get_full_path()})}"
        )
        response["Cache-Control"] = "no-store"
        return response

    return default_exception_handler(exc, context)
