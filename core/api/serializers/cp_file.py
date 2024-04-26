from django.urls import reverse
from rest_framework import serializers

from core.models.country import Country
from core.models.country_programme import CPFile


class CPFileSerializer(serializers.ModelSerializer):
    country_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=Country.objects.all().values_list("id", flat=True),
    )
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = CPFile
        fields = [
            "id",
            "country_id",
            "year",
            "uploaded_at",
            "filename",
            "download_url",
        ]

    def get_download_url(self, obj):
        return reverse("country-programme-files-download", args=(obj.id,))
