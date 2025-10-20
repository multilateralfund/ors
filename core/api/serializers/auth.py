from datetime import timedelta

from dj_rest_auth.serializers import (
    PasswordResetSerializer,
    UserDetailsSerializer,
    JWTSerializer,
)
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from rest_framework_simplejwt.tokens import RefreshToken

EXTERNAL_USERS_TOKEN_EXIPIRY_DAYS = 365


# pylint: disable=W0223
class CustomPasswordResetSerializer(PasswordResetSerializer):
    def get_email_options(self):
        return {
            "email_template_name": "registration/password_reset_email.txt",
            "html_email_template_name": "registration/password_reset_email.html",
        }


class CustomUserDetailsSerializer(UserDetailsSerializer):
    agency = serializers.StringRelatedField(
        read_only=True, source="agency.name", allow_null=True
    )
    country = serializers.StringRelatedField(
        read_only=True, source="country.name", allow_null=True
    )
    user_type = serializers.CharField(read_only=True, allow_null=True)
    full_name = serializers.SerializerMethodField()

    class Meta(UserDetailsSerializer.Meta):
        fields = UserDetailsSerializer.Meta.fields + (
            "full_name",
            "country",
            "country_id",
            "agency",
            "agency_id",
            "user_type",
        )
        read_only_fields = UserDetailsSerializer.Meta.read_only_fields + (
            "full_name",
            "country",
            "country_id",
            "agency",
            "agency_id",
            "user_type",
        )

    def get_full_name(self, obj):
        return obj.get_full_name()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer so that ekimetric's account gets an extended lifetime
    for its token.
    """

    @classmethod
    def get_token(cls, user):
        if hasattr(user, "is_external_service") and user.is_external_service:
            refresh = RefreshToken.for_user(user)
            refresh.set_exp(lifetime=timedelta(days=EXTERNAL_USERS_TOKEN_EXIPIRY_DAYS))
            refresh.access_token.set_exp(
                lifetime=timedelta(days=EXTERNAL_USERS_TOKEN_EXIPIRY_DAYS)
            )
            return refresh

        return super().get_token(user)


class CustomJWTSerializer(JWTSerializer):
    @classmethod
    def get_token(cls, user):
        """Override to use our custom token generation"""
        if hasattr(user, "is_external_service") and user.is_external_service:
            refresh = RefreshToken.for_user(user)
            refresh.set_exp(lifetime=timedelta(days=EXTERNAL_USERS_TOKEN_EXIPIRY_DAYS))
            refresh.access_token.set_exp(
                lifetime=timedelta(days=EXTERNAL_USERS_TOKEN_EXIPIRY_DAYS)
            )
            return refresh

        return RefreshToken.for_user(user)
