from rest_framework import serializers
from core.api.serializers.adm import CP_GENERATION_CHEMICAL

from core.api.serializers.base import BaseCPRowSerializer
from core.models.country_programme import CPGeneration, CPReport
from core.models.country_programme_archive import CPGenerationArchive


class CPGenerationBaseSerializer(BaseCPRowSerializer):
    chemical_name = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReport.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    class Meta:
        fields = BaseCPRowSerializer.Meta.fields + [
            "id",
            "chemical_name",
            "display_name",
            "all_uses",
            "feedstock",
            "destruction",
            "country_programme_report_id",
        ]

    def get_chemical_name(self, _):
        return CP_GENERATION_CHEMICAL

    def get_display_name(self, _):
        return CP_GENERATION_CHEMICAL


class CPGenerationSerializer(CPGenerationBaseSerializer):
    class Meta(CPGenerationBaseSerializer.Meta):
        model = CPGeneration


class CPGenerationArchiveSerializer(CPGenerationBaseSerializer):
    class Meta(CPGenerationBaseSerializer.Meta):
        model = CPGenerationArchive
