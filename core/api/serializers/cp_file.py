from rest_framework import serializers
from core.models.country import Country
from core.models.country_programme import CPFile


class CPFileSerializer(serializers.ModelSerializer):
    country_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=Country.objects.all().values_list("id", flat=True),
    )

    class Meta:
        model = CPFile
        fields = [
            "id",
            "country_id",
            "year",
            "filename",
            "file",
        ]
