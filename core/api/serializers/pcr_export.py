from django.urls import reverse
from rest_framework import serializers

from core.api.export.pcr.constants import SECTION_KEYS
from core.models.project_completion_report import PCRExport

# pylint: disable=abstract-method


class PCRExportCreateSerializer(serializers.Serializer):
    output_format = serializers.ChoiceField(choices=PCRExport.OutputFormat.choices)
    sections = serializers.MultipleChoiceField(choices=SECTION_KEYS, allow_empty=False)

    def validate_sections(self, value):
        # in the order of the PCR
        return [key for key in SECTION_KEYS if key in value]


class PCRExportSerializer(serializers.ModelSerializer):
    pcr_count = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = PCRExport
        fields = [
            "id",
            "status",
            "output_format",
            "sections",
            "pcr_count",
            "filename",
            "error",
            "download_url",
            "date_created",
        ]

    def get_pcr_count(self, obj) -> int:
        return len(obj.meta_project_ids)

    def get_download_url(self, obj) -> str | None:
        if obj.status != PCRExport.Status.COMPLETED or not obj.file:
            return None
        return reverse("pcr-export-download", args=(obj.id,))
