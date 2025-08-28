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
            "stored_at_start_of_year",
            "all_uses",
            "feedstock_gc",
            "destruction",
            "feedstock_wpc",
            "destruction_wpc",
            "generated_emissions",
            "stored_at_end_of_year",
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
        "total": "Total amount generated (tonnes)",
        "all_uses": "Amount generated and captured (tonnes) - For uses excluding feedstocks",
        "stored_at_start_of_year": "Amount stored at the beginning of the year (tonnes)",
        "feedstock_gc": "Amount generated and captured (tonnes) - For feedstock use in your country",
        "destruction": "Amount generated and captured (tonnes) - For destruction",
        "feedstock_wpc": "Amount used for feedstock without prior capture (tonnes)",
        "destruction_wpc": "Amount destroyed in the facility without prior capture (tonnes)",
        "generated_emissions": "Amount of generated emissions (tonnes)",
        "stored_at_end_of_year": "Amount stored at the end of the year (tonnes)",
    }

    class Meta(BaseDashboardsEmissionsSerializer.Meta):
        model = AllEmissionsView

    def get_object_type(self, _obj):
        return "emission"
