from rest_framework import serializers
from core.api.serializers.adm import CP_GENERATION_CHEMICAL

from core.api.serializers.base import BaseCPRowSerializer
from core.model_views.country_programme import AllGenerationsView
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


class DashboardsCPGenerationSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source="report_year")
    version = serializers.IntegerField(source="report_version")
    created_at = serializers.DateTimeField(source="report_created_at")
    data = serializers.SerializerMethodField()
    region = serializers.SerializerMethodField()
    substance_name = serializers.SerializerMethodField()
    substance_id = serializers.SerializerMethodField()
    object_type = serializers.SerializerMethodField()
    facility_name = serializers.SerializerMethodField()

    ATTRIBUTE_NAMES_MAPPING = {
        "all_uses": "Amount generated and captured - For all uses",
        "feedstock": "Amount generated and captured - For feedstock use in your country",
        "destruction": "Amount generated and captured - For destruction",
    }

    class Meta:
        model = AllGenerationsView
        fields = [
            "country_id",
            "country_name",
            "region",
            "version",
            "created_at",
            "year",
            "report_status",
            "substance_name",
            "substance_id",
            "facility_name",
            "object_type",
            "data",
        ]

    def get_object_type(self, _obj):
        return "generation"

    def get_facility_name(self, obj):
        return ""

    def get_substance_name(self, _obj):
        return self.context["substance_name"]

    def get_substance_id(self, _obj):
        return self.context["substance_id"]

    def get_region(self, obj):
        return self.context["country_region_dict"].get(obj.country_id)

    def _get_type_dict(self, attr_name, obj):
        subst_gwp = self.context["substance_gwp"]
        type_name = self.ATTRIBUTE_NAMES_MAPPING[attr_name]
        value = getattr(obj, attr_name) or 0
        return [
            {
                "type_name": type_name,
                "measurement_type": "mt",
                "value": value,
            },
            {
                "type_name": type_name,
                "measurement_type": "gwp",
                "value": value * subst_gwp,
            },
        ]

    def get_data(self, obj):
        type_data = []
        for attr_name in self.ATTRIBUTE_NAMES_MAPPING:
            type_data.extend(self._get_type_dict(attr_name, obj))
        return {"type": type_data}
