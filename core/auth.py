import jwt
from typing import Optional, Tuple

from django_auth_adfs.backend import AdfsAccessTokenBackend, AdfsAuthCodeBackend
from django_auth_adfs.rest_framework import AdfsAccessTokenAuthentication
from django.contrib.auth.backends import ModelBackend
from django.conf import settings

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

#pylint: disable=bare-except,import-outside-toplevel,broad-exception-caught

class HandleMultipleAuthBackend:
    def authenticate(self, request, **kwargs):
        if request and request.META.get("HTTP_AUTHORIZATION", "").startswith("Bearer "):
            backend = AdfsAccessTokenBackend()
            user = backend.authenticate(request, **kwargs)
            if user:
                return user

        if request and request.GET.get("code"):
            backend = AdfsAuthCodeBackend()
            user = backend.authenticate(request, **kwargs)
            if user:
                return user

        backend = ModelBackend()
        return backend.authenticate(request, **kwargs)

    def get_user(self, user_id):
        try:
            from django.contrib.auth import get_user_model

            User = get_user_model()
            return User.objects.get(pk=user_id)
        except:
            return None


class SmartTokenAuthentication(BaseAuthentication):
    """
    Inspect bearer token claims (unverified) and delegate to the correct token auth backend.
    Falls back to the other backend if the preferred one fails.
    """

    def _looks_like_adfs(self, claims) -> bool:
        iss = str(claims.get("iss", "") or "").lower()
        aud = claims.get("aud", "")
        aud_list = aud if isinstance(aud, (list, tuple)) else [aud] if aud else []
        adfs_cfg = getattr(settings, "AUTH_ADFS", {}) or {}
        configured_aud = adfs_cfg.get("AUDIENCE") or adfs_cfg.get("CLIENT_ID") or []
        if isinstance(configured_aud, (list, tuple)):
            configured_aud_list = list(configured_aud)
        else:
            configured_aud_list = [configured_aud] if configured_aud else []
        if any(x and x in iss for x in ("login.microsoftonline", "sts.windows")):
            return True
        if any(a in configured_aud_list for a in aud_list if a):
            return True
        return False

    def authenticate(self, request) -> Optional[Tuple[object, object]]:
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1]
        try:
            claims = jwt.decode(token, options={"verify_signature": False})
        except Exception:
            claims = {}

        prefer_adfs = self._looks_like_adfs(claims)

        if prefer_adfs:
            try:
                return AdfsAccessTokenAuthentication().authenticate(request)
            except AuthenticationFailed:
                return JWTAuthentication().authenticate(request)
        else:
            try:
                return JWTAuthentication().authenticate(request)
            except AuthenticationFailed:
                return AdfsAccessTokenAuthentication().authenticate(request)
