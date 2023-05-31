from rest_framework import serializers

from core.models.country_programme import (
    CountryProgrammeRecord,
    CountryProgrammeReport,
    CountryProgrammeUsage,
)


# countryProgramReport serializer
class CountryProgrammeReportSerializer(serializers.ModelSerializer):
    country = serializers.StringRelatedField()

    class Meta:
        model = CountryProgrammeReport
        fields = [
            "id",
            "name",
            "year",
            "country",
            "comment",
        ]


class CountryProgrammeUsageSerializer(serializers.ModelSerializer):
    usage = serializers.StringRelatedField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=3)

    class Meta:
        model = CountryProgrammeUsage
        fields = [
            "usage",
            "quantity",
        ]


class CountryProgrammeRecordSerializer(serializers.ModelSerializer):
    blend = serializers.StringRelatedField()
    substance = serializers.StringRelatedField()
    record_usages = CountryProgrammeUsageSerializer(many=True)

    class Meta:
        model = CountryProgrammeRecord
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
