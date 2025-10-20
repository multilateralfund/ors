from datetime import datetime, timedelta, timezone

from dj_rest_auth.views import LoginView
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken


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
                    str(refresh.access_token),
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
