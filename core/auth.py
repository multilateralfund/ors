import jwt
import logging

from django_auth_adfs.rest_framework import AdfsAccessTokenAuthentication
from django.conf import settings

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

logger = logging.getLogger(__name__)

# pylint: disable=bare-except,import-outside-toplevel,broad-exception-caught


class SmartTokenAuthentication(BaseAuthentication):
    """
    Inspect bearer token claims (unverified) and delegate to the correct token auth backend.
    Falls back to the other backend if the preferred one fails.
    """

    def _get_token(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Bearer "):
            return auth_header.split(" ", 1)[1]

        jwt_cookie_name = getattr(settings, "REST_AUTH", {}).get("JWT_AUTH_COOKIE")
        if jwt_cookie_name:
            return request.COOKIES.get(jwt_cookie_name)

        return None

    def _is_adfs_token(self, token: dict) -> bool:
        try:
            claims = jwt.decode(token, options={"verify_signature": False})
        except Exception:
            return False

        iss = (claims.get("iss") or "").lower()
        # common MS issuers
        if any(
            x in iss
            for x in ("login.microsoftonline", "sts.windows", "microsoftonline")
        ):
            return True
        # match configured ADFS audience/client id
        adfs_cfg = getattr(settings, "AUTH_ADFS", {}) or {}
        configured_aud = adfs_cfg.get("AUDIENCE") or adfs_cfg.get("CLIENT_ID")
        if configured_aud:
            if not isinstance(configured_aud, (list, tuple)):
                configured_aud = [configured_aud]
            aud = claims.get("aud")
            aud_values = aud if isinstance(aud, (list, tuple)) else [aud] if aud else []
            if any(a in configured_aud for a in aud_values if a):
                return True
        return False

    def authenticate(self, request):
        token = self._get_token(request)
        if not token:
            return None

        if self._is_adfs_token(token):
            try:
                return AdfsAccessTokenAuthentication().authenticate(request)
            except AuthenticationFailed:
                pass

        # If token came from cookie, expose it as Authorization for JWTAuthentication
        if "HTTP_AUTHORIZATION" not in request.META or not request.META[
            "HTTP_AUTHORIZATION"
        ].startswith("Bearer "):
            request.META["HTTP_AUTHORIZATION"] = f"Bearer {token}"

        return JWTAuthentication().authenticate(request)
