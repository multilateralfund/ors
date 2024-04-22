from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.models.country_programme import CPHistory, CPReport

User = get_user_model()


class CPHistorySerializer(serializers.ModelSerializer):
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReport.objects.all().values_list("id", flat=True),
        write_only=True,
    )
    updated_by_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=User.objects.all().values_list("id", flat=True),
        write_only=True,
    )
    updated_by_username = serializers.StringRelatedField(
        read_only=True,
        source="updated_by.username",
    )

    class Meta:
        model = CPHistory
        fields = [
            "id",
            "country_programme_report_id",
            "created_at",
            "updated_by_id",
            "updated_by_username",
            "event_description",
            "report_version",
        ]
