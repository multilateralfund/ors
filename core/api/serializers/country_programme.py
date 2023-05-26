from rest_framework import serializers

from core.models.country_programme import CountryProgrammeReport


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
