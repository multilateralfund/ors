from rest_framework import serializers

from core.models.country_programme import (
    CPEmission,
    CPGeneration,
    CPPrices,
    CPRecord,
    CPReport,
    CPUsage,
)

CP_GENERATION_CHEMICAL = "HFC-23"


# countryProgramReport serializer
class CPReportSerializer(serializers.ModelSerializer):
    country = serializers.StringRelatedField()

    class Meta:
        model = CPReport
        fields = [
            "id",
            "name",
            "year",
            "country",
            "comment",
        ]


class CPUsageSerializer(serializers.ModelSerializer):
    usage = serializers.StringRelatedField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=3)

    class Meta:
        model = CPUsage
        fields = [
            "usage",
            "usage_id",
            "quantity",
        ]


class CPRecordSerializer(serializers.ModelSerializer):
    chemical_name = serializers.SerializerMethodField()
    annex_group = serializers.SerializerMethodField()
    usages = CPUsageSerializer(source="record_usages", many=True)

    class Meta:
        model = CPRecord
        fields = [
            "id",
            "chemical_name",
            "substance_id",
            "blend_id",
            "annex_group",
            "display_name",
            "section",
            "imports",
            "import_quotas",
            "exports",
            "export_quotas",
            "production",
            "manufacturing_blends",
            "banned_date",
            "remarks",
            "usages",
        ]

    def get_chemical_name(self, obj):
        return obj.substance.name if obj.substance else obj.blend.name

    def get_annex_group(self, obj):
        return (
            obj.substance.group.name if obj.substance and obj.substance.group else None
        )


class CPPricesSerializer(serializers.ModelSerializer):
    chemical_name = serializers.SerializerMethodField()
    annex_group = serializers.SerializerMethodField()

    class Meta:
        model = CPPrices
        fields = [
            "id",
            "chemical_name",
            "substance_id",
            "blend_id",
            "display_name",
            "annex_group",
            "previous_year_price",
            "current_year_price",
            "remarks",
        ]

    def get_chemical_name(self, obj):
        return obj.substance.name if obj.substance else obj.blend.name

    def get_annex_group(self, obj):
        return (
            obj.substance.group.name if obj.substance and obj.substance.group else None
        )


class CPGenerationSerializer(serializers.ModelSerializer):
    chemical_name = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = CPGeneration
        fields = [
            "id",
            "chemical_name",
            "display_name",
            "all_uses",
            "feedstock",
            "destruction",
        ]

    def get_chemical_name(self, _):
        return CP_GENERATION_CHEMICAL

    def get_display_name(self, _):
        return CP_GENERATION_CHEMICAL


class CPEmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CPEmission
        fields = [
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
        ]
