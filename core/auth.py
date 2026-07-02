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

    def _is_adfs_token(self, claims: dict) -> bool:
        iss = (claims.get("iss") or "").lower()
        aud = claims.get("aud")
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
            aud_values = aud if isinstance(aud, (list, tuple)) else [aud] if aud else []
            if any(a in configured_aud for a in aud_values):
                return True
        return False

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None

        # try ADFS first
        try:
            return AdfsAccessTokenAuthentication().authenticate(request)
        except AuthenticationFailed:
            pass

        # then JWT
        try:
            return JWTAuthentication().authenticate(request)
        except AuthenticationFailed:
            pass

        return None
