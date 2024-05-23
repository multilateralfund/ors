from django.urls import reverse
from rest_framework import serializers

from core.models.agency import Agency
from core.models.business_plan import BPFile


class BPFileSerializer(serializers.ModelSerializer):
    agency_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=Agency.objects.all().values_list("id", flat=True),
    )
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = BPFile
        fields = [
            "id",
            "agency_id",
            "year_start",
            "year_end",
            "uploaded_at",
            "filename",
            "download_url",
        ]

    def get_download_url(self, obj):
        return reverse("business-plan-files-download", args=(obj.id,))
