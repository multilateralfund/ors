from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.models.country_programme import CPHistory, CPReport
from core.models.country_programme_archive import CPHistoryArchive, CPReportArchive

User = get_user_model()


class CPHistoryBaseSerializer(serializers.ModelSerializer):
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
        fields = [
            "id",
            "country_programme_report_id",
            "updated_by_id",
            "updated_by_username",
            "event_description",
        ]


class CPHistorySerializer(CPHistoryBaseSerializer):
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReport.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    class Meta(CPHistoryBaseSerializer.Meta):
        model = CPHistory


class CPHistoryArchiveSerializer(CPHistoryBaseSerializer):
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReportArchive.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    class Meta(CPHistoryBaseSerializer.Meta):
        model = CPHistoryArchive
