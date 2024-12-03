from rest_framework import serializers

from core.api.serializers.base import BaseCPWChemicalSerializer
from core.models.country_programme import CPPrices
from core.models.country_programme_archive import CPPricesArchive


class CPPricesBaseSerializer(BaseCPWChemicalSerializer):
    previous_year_price = serializers.CharField(required=False, allow_null=True)
    current_year_price = serializers.CharField(required=True)
    remarks = serializers.CharField(required=False, allow_blank=True)
    computed_prev_year_price = serializers.SerializerMethodField()

    class Meta:
        fields = BaseCPWChemicalSerializer.Meta.fields + [
            "previous_year_price",
            "current_year_price",
            "computed_prev_year_price",
            "remarks",
            "is_retail",
            "is_fob",
        ]

    def get_computed_prev_year_price(self, obj):
        return getattr(obj, "computed_prev_year_price", None)

    def get_group(self, obj):
        if obj.blend:
            return "HFCs"
        if obj.substance:
            if "HCFC" in obj.substance.name:
                return "HCFCs"
            if "HFC" in obj.substance.name:
                return "HFCs"
            return "Alternatives"

        return None

    def validate_previous_year_price(self, value):
        # check if the value is a float number
        try:
            if value:
                float(value)
        except ValueError as exc:
            raise serializers.ValidationError(
                "Previous year price must be a number"
            ) from exc

        return value

    def validate_current_year_price(self, value):
        # check if the value is a float number
        try:
            if value:
                float(value)
        except ValueError as exc:
            raise serializers.ValidationError(
                "Current year price must be a number"
            ) from exc

        return value

    def get_display_name(self, obj):
        if obj.display_name:
            return obj.display_name
        if obj.substance:
            return obj.substance.name
        if obj.blend:
            return obj.blend.name
        return None


class CPPricesSerializer(CPPricesBaseSerializer):
    class Meta(CPPricesBaseSerializer.Meta):
        model = CPPrices


class CPPricesArchiveSerializer(CPPricesBaseSerializer):
    class Meta(CPPricesBaseSerializer.Meta):
        model = CPPricesArchive


class CPPricesListSerializer(serializers.ModelSerializer):
    substance_name = serializers.SerializerMethodField()
    blend_name = serializers.SerializerMethodField()
    country_name = serializers.CharField(source="country_programme_report.country.name")
    year = serializers.IntegerField(source="country_programme_report.year")
    group = serializers.SerializerMethodField()
    group_id = serializers.SerializerMethodField()

    class Meta:
        model = CPPrices
        fields = [
            "country_name",
            "year",
            "substance_id",
            "substance_name",
            "blend_id",
            "blend_name",
            "group",
            "group_id",
            "previous_year_price",
            "current_year_price",
            "remarks",
            "is_retail",
            "is_fob",
        ]
        read_only_fields = fields

    def get_group(self, obj):
        if obj.blend:
            return "Blends (Mixture of Controlled Substances)"

        if obj.substance and obj.substance.group:
            return obj.substance.group.name_alt

        return None

    def get_group_id(self, obj):
        if obj.substance and obj.substance.group:
            return obj.substance.group_id

        return None

    def get_substance_name(self, obj):
        return obj.substance.name if obj.substance else None

    def get_blend_name(self, obj):
        return obj.blend.name if obj.blend else None
