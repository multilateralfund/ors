from rest_framework import serializers
from core.models.country_programme import CPFile, CPReport
from core.models.country_programme_archive import CPFileArchive


class CPFileBaseSerializer(serializers.ModelSerializer):
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReport.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    class Meta:
        fields = [
            "id",
            "country_programme_report_id",
            "filename",
            "file",
        ]


class CPFileSerializer(CPFileBaseSerializer):
    class Meta(CPFileBaseSerializer.Meta):
        model = CPFile


class CPFileArchiveSerializer(CPFileBaseSerializer):
    class Meta(CPFileBaseSerializer.Meta):
        model = CPFileArchive
