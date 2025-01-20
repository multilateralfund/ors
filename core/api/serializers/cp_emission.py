from rest_framework import serializers

from core.api.serializers.base import (
    BaseCPRowSerializer,
    BaseDashboardsEmissionsSerializer,
)
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


class DashboardsCPEmissionSerializer(BaseDashboardsEmissionsSerializer):
    facility_name = serializers.CharField(source="facility")

    ATTRIBUTE_NAMES_MAPPING = {
        "total": "Total amount generated",
        "all_uses": "Amount generated and captured - For all uses",
        "feedstock_gc": "Amount generated and captured - For feedstock use in your country",
        "destruction": "Amount generated and captured - For destruction",
        "feedstock_wpc": "Amount used for feedstock without prior capture",
        "destruction_wpc": "Amount destroyed without prior capture",
        "generated_emissions": "Amount of generated emissions",
    }

    class Meta(BaseDashboardsEmissionsSerializer.Meta):
        model = AllEmissionsView

    def get_object_type(self, _obj):
        return "emission"
