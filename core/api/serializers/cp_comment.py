from rest_framework import serializers

from core.models.country_programme import CPComment, CPReport
from core.models.country_programme_archive import CPCommentArchive, CPReportArchive


class CPCommentBaseSerializer(serializers.ModelSerializer):
    class Meta:
        fields = [
            "country_programme_report_id",
            "section",
            "comment_type",
            "comment",
        ]


class CPCommentSerializer(CPCommentBaseSerializer):
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReport.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    class Meta(CPCommentBaseSerializer.Meta):
        model = CPComment


class CPCommentArchiveSerializer(CPCommentBaseSerializer):
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReportArchive.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    class Meta(CPCommentBaseSerializer.Meta):
        model = CPCommentArchive
