from dj_rest_auth.serializers import PasswordResetSerializer, UserDetailsSerializer

from rest_framework import serializers


# pylint: disable=W0223
class CustomPasswordResetSerializer(PasswordResetSerializer):
    def get_email_options(self):
        return {
            "email_template_name": "registration/password_reset_email.txt",
            "html_email_template_name": "registration/password_reset_email.html",
        }


class CustomUserDetailsSerializer(UserDetailsSerializer):
    country = serializers.StringRelatedField(
        read_only=True, source="country.name", allow_null=True
    )
    user_type = serializers.CharField(read_only=True, allow_null=True)

    class Meta(UserDetailsSerializer.Meta):
        fields = UserDetailsSerializer.Meta.fields + ("country", "user_type")
        read_only_fields = UserDetailsSerializer.Meta.read_only_fields + (
            "country",
            "user_type",
        )
