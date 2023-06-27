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
            "quantity",
        ]


class CPRecordSerializer(serializers.ModelSerializer):
    chemical_name = serializers.SerializerMethodField()
    chemical_group_name = serializers.SerializerMethodField()
    record_usages = CPUsageSerializer(many=True)

    class Meta:
        model = CPRecord
        fields = [
            "id",
            "chemical_name",
            "chemical_group_name",
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
            "record_usages",
        ]

    def get_chemical_name(self, obj):
        return obj.substance.name if obj.substance else obj.blend.name

    def get_chemical_group_name(self, obj):
        return (
            obj.substance.group.name if obj.substance and obj.substance.group else None
        )


class CPPricesSerializer(serializers.ModelSerializer):
    chemical_name = serializers.SerializerMethodField()

    class Meta:
        model = CPPrices
        fields = [
            "id",
            "chemical_name",
            "display_name",
            "previous_year_price",
            "previous_year_text",
            "current_year_price",
            "current_year_text",
            "remarks",
        ]

    def get_chemical_name(self, obj):
        return obj.substance.name if obj.substance else obj.blend.name


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
