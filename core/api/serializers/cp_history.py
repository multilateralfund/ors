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
    updated_by_email = serializers.StringRelatedField(
        read_only=True,
        source="updated_by.email",
    )
    updated_by_first_name = serializers.StringRelatedField(
        read_only=True,
        source="updated_by.first_name",
    )
    updated_by_last_name = serializers.StringRelatedField(
        read_only=True,
        source="updated_by.last_name",
    )

    class Meta:
        model = CPHistory
        fields = [
            "id",
            "country_programme_report_id",
            "created_at",
            "updated_by_id",
            "updated_by_username",
            "updated_by_email",
            "updated_by_first_name",
            "updated_by_last_name",
            "reporting_officer_name",
            "reporting_officer_email",
            "event_description",
            "event_in_draft",
            "report_version",
        ]
