from rest_framework import serializers

from core.api.serializers.base import BaseCPRowSerializer
from core.models.country_programme import CPEmission, CPReport


class CPEmissionSerializer(BaseCPRowSerializer):
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
