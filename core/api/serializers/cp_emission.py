from rest_framework import serializers

from core.api.serializers.base import BaseCPRowSerializer
from core.model_views.country_programme import AllEmissionsView
from core.models.country_programme import CPEmission, CPReport
from core.models.country_programme_archive import CPEmissionArchive


class CPEmissionBaseSerializer(BaseCPRowSerializer):
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReport.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    class Meta:
        model = CPEmission
        fields = BaseCPRowSerializer.Meta.fields + [
            "id",
            "facility",
            "total",
            "all_uses",
            "feedstock_gc",
            "destruction",
            "feedstock_wpc",
            "destruction_wpc",
            "generated_emissions",
            "remarks",
            "country_programme_report_id",
        ]


class CPEmissionSerializer(CPEmissionBaseSerializer):
    class Meta(CPEmissionBaseSerializer.Meta):
        model = CPEmission


class CPEmissionArchiveSerializer(CPEmissionBaseSerializer):
    class Meta(CPEmissionBaseSerializer.Meta):
        model = CPEmissionArchive


class DashboardsCPEmissionSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source="report_year")
    version = serializers.IntegerField(source="report_version")
    created_at = serializers.DateTimeField(source="report_created_at")
    data = serializers.SerializerMethodField()
    facility_name = serializers.CharField(source="facility")
    region = serializers.SerializerMethodField()
    substance_name = serializers.SerializerMethodField()
    substance_id = serializers.SerializerMethodField()
    object_type = serializers.SerializerMethodField()

    ATTRIBUTE_NAMES_MAPPING = {
        "total": "Amount generated and captured - Total amount generated",
        "all_uses": "Amount generated and captured - For all uses",
        "feedstock_gc": "Amount generated and captured - For feedstock use in your country",
        "destruction": "Amount generated and captured - For destruction",
        "feedstock_wpc": "Amount used for feedstock without prior capture",
        "destruction_wpc": "Amount destroyed without prior capture",
        "generated_emissions": "Amount of generated emissions",
    }

    class Meta:
        model = AllEmissionsView
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
        return "emission"

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
        if not value:
            return []

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
