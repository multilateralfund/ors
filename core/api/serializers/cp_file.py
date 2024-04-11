from rest_framework import serializers
from core.models.country_programme import CPFile, CPReport


class CPFileSerializer(serializers.ModelSerializer):
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReport.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    class Meta:
        model = CPFile
        fields = [
            "id",
            "country_programme_report_id",
            "filename",
            "file",
        ]
