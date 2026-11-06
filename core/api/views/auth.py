# pylint: disable=ungrouped-imports,abstract-method

from datetime import datetime, timedelta, timezone

from dj_rest_auth.app_settings import api_settings as rest_auth_settings
from dj_rest_auth.jwt_auth import CookieTokenRefreshSerializer, get_refresh_view
from dj_rest_auth.views import LoginView
from django.conf import settings

from django_auth_adfs.rest_framework import AdfsAccessTokenAuthentication
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework.views import APIView

from core.models import User


class CustomLoginView(LoginView):
    """Custom login view that generates extended tokens for external service users"""

    def get_response(self):
        response = super().get_response()

        # Check if user is external service and override tokens
        if hasattr(self.user, "is_external_service") and self.user.is_external_service:
            refresh = RefreshToken.for_user(self.user)

            # Override expiration times directly in the payload
            duration = timedelta(days=settings.EXTERNAL_USERS_TOKEN_EXIPIRY_DAYS)

            current_time = datetime.now(timezone.utc)
            refresh.payload["exp"] = int((current_time + duration).timestamp())

            access = refresh.access_token
            access.payload["exp"] = int((current_time + duration).timestamp())

            # Override the tokens in the response data
            response.data["access_token"] = str(access)
            response.data["refresh_token"] = str(refresh)

            # Also update the cookie tokens if they exist
            if hasattr(response, "set_cookie"):
                response.set_cookie(
                    "orsauth",
                    str(access),
                    max_age=duration.total_seconds(),
                    httponly=False,
                    samesite="Lax",
                )
                response.set_cookie(
                    "orsrefresh",
                    str(refresh),
                    max_age=duration.total_seconds(),
                    httponly=True,
                    samesite="Lax",
                )

        return response


class ExternalServiceTokenRefreshSerializer(CookieTokenRefreshSerializer):
    """
    External service users keep their long-lived access token after a refresh:
    the new access token expires together with the refresh token from login.
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        # super().validate() sets attrs["refresh"] (from the body or the cookie)
        refresh = RefreshToken(attrs["refresh"])
        is_external_service = User.objects.filter(
            id=refresh.payload.get(jwt_settings.USER_ID_CLAIM),
            is_external_service=True,
        ).exists()
        if is_external_service:
            access = AccessToken(data["access"])
            access.payload["exp"] = refresh.payload["exp"]
            data["access"] = str(access)
        return data


class CustomTokenRefreshView(get_refresh_view()):
    serializer_class = ExternalServiceTokenRefreshSerializer

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK and "access" in response.data:
            # the parent uses ACCESS_TOKEN_LIFETIME, use the token's actual expiry
            expiration = datetime.fromtimestamp(
                AccessToken(response.data["access"]).payload["exp"], tz=timezone.utc
            )
            response.data["access_token_expiration"] = expiration
            response.set_cookie(
                rest_auth_settings.JWT_AUTH_COOKIE,
                response.data["access"],
                expires=expiration,
                secure=rest_auth_settings.JWT_AUTH_SECURE,
                httponly=rest_auth_settings.JWT_AUTH_HTTPONLY,
                samesite=rest_auth_settings.JWT_AUTH_SAMESITE,
            )
        return response


class ADFSLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Bearer token required for ADFS login."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = AdfsAccessTokenAuthentication().authenticate(request)
        if result is None:
            return Response(
                {"detail": "Invalid ADFS access token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user, _ = result
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        response = Response(
            {"access": access, "refresh": str(refresh)},
            status=status.HTTP_200_OK,
        )

        cookie_opts = {
            "httponly": False,
            "secure": settings.SESSION_COOKIE_SECURE,
            "samesite": "Lax",
            "path": "/",
        }

        response.set_cookie(
            settings.REST_AUTH["JWT_AUTH_COOKIE"],
            access,
            **cookie_opts,
        )
        response.set_cookie(
            settings.REST_AUTH["JWT_AUTH_REFRESH_COOKIE"],
            str(refresh),
            **cookie_opts,
        )

        return response
