from rest_framework import serializers
from core.models.country_programme import CPFile, CPReport
from core.models.country_programme_archive import CPFileArchive, CPReportArchive


class CPFileBaseSerializer(serializers.ModelSerializer):
    country_programme_report_version = serializers.FloatField(
        source="country_programme_report.version"
    )

    class Meta:
        fields = [
            "id",
            "country_programme_report_id",
            "country_programme_report_version",
            "filename",
            "file",
        ]


class CPFileSerializer(CPFileBaseSerializer):
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReport.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    class Meta(CPFileBaseSerializer.Meta):
        model = CPFile


class CPFileArchiveSerializer(CPFileBaseSerializer):
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReportArchive.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    class Meta(CPFileBaseSerializer.Meta):
        model = CPFileArchive
