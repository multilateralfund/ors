from rest_framework import serializers
from dj_rest_auth.serializers import PasswordResetSerializer

from core.models import Substance
from core.models import Group
from core.models import Usage


class CustomPasswordResetSerializer(PasswordResetSerializer):
    def get_email_options(self):
        return {
            "html_email_template_name": "registration/password_reset_email.html",
        }


class RecursiveField(serializers.Serializer):
    def to_representation(self, value):
        serializer = self.parent.parent.__class__(value, context=self.context)
        return serializer.data


class UsageSerializer(serializers.ModelSerializer):
    children = RecursiveField(many=True, read_only=True)

    class Meta:
        model = Usage
        fields = ["id", "name", "sort_order", "children"]
