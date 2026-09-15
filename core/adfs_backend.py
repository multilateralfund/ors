from django_auth_adfs.backend import AdfsAccessTokenBackend, AdfsAuthCodeBackend

from core.auth import fill_missing_email_claim


class EmailClaimFallbackMixin:
    """Populate the email claim after django-auth-adfs validates a token."""

    def validate_access_token(self, access_token):
        claims = super().validate_access_token(access_token)
        return fill_missing_email_claim(claims)


class EmailFallbackAdfsAccessTokenBackend(
    EmailClaimFallbackMixin, AdfsAccessTokenBackend
):
    """Authenticate access tokens with a fallback email claim."""


class EmailFallbackAdfsAuthCodeBackend(EmailClaimFallbackMixin, AdfsAuthCodeBackend):
    """Authenticate authorization codes with a fallback email claim."""
