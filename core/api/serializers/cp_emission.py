from rest_framework import serializers

from core.api.serializers.base import BaseCPRowSerializer
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


class CPEmissionListSerializer(serializers.ModelSerializer):
    country_id = serializers.IntegerField(source="country_programme_report.country_id")
    country_name = serializers.CharField(source="country_programme_report.country.name")
    year = serializers.IntegerField(source="country_programme_report.year")
    data = serializers.SerializerMethodField()
    substance_name = serializers.CharField(source="substance.name")
    substance_id = serializers.IntegerField(source="substance.id")
    facility_name = serializers.CharField(source="facility")
    region = serializers.CharField()

    ATTRIBUTE_NAMES_MAPPING = {
        "total": "Total amount generated",
        "all_uses": "Amount generated and captured - For all uses",
        "feedstock_gc": "Amount generated and captured - For feedstock use in your country",
        "destruction": "Amount generated and captured - For destruction",
        "feedstock_wpc": "Captured for feedstock uses within your country",
        "destruction_wpc": "Amount used for feedstock without prior capture",
        "generated_emissions": "Captured for destruction",
    }

    class Meta:
        model = CPEmission
        fields = [
            "country_id",
            "country_name",
            "region",
            "year",
            "substance_name",
            "substance_id",
            "facility_name",
            "remarks",
            "data",
        ]

    def _get_type_dict(self, attr_name, obj):

        subst_gwp = obj.substance.gwp
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
