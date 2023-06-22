from rest_framework import serializers

from core.models.country_programme import (
    CPRecord,
    CPReport,
    CPUsage,
)


# countryProgramReport serializer
class CPReportSerializer(serializers.ModelSerializer):
    country = serializers.StringRelatedField()

    class Meta:
        model = CPReport
        fields = [
            "id",
            "name",
            "year",
            "country",
            "comment",
        ]


class CPUsageSerializer(serializers.ModelSerializer):
    usage = serializers.StringRelatedField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=3)

    class Meta:
        model = CPUsage
        fields = [
            "usage",
            "quantity",
        ]


class CPRecordSerializer(serializers.ModelSerializer):
    blend = serializers.StringRelatedField()
    substance = serializers.StringRelatedField()
    record_usages = CPUsageSerializer(many=True)

    class Meta:
        model = CPRecord
        fields = [
            "id",
            "blend",
            "substance",
            "country_programme_report_id",
            "display_name",
            "section",
            "imports",
            "import_quotas",
            "exports",
            "production",
            "manufacturing_blends",
            "banned_date",
            "remarks",
            "record_usages",
        ]
