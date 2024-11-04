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
