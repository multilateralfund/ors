from rest_framework import serializers

from core.api.serializers.base import BaseCPWChemicalSerializer
from core.model_views.country_programme import AllPricesView
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
    country_id = serializers.IntegerField(source="country_programme_report.country_id")
    country_name = serializers.CharField(source="country_programme_report.country.name")
    year = serializers.IntegerField(source="country_programme_report.year")
    group = serializers.SerializerMethodField()
    group_id = serializers.SerializerMethodField()

    class Meta:
        model = CPPrices
        fields = [
            "country_id",
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


class DashboardsCPPricesSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source="report_year")
    version = serializers.IntegerField(source="report_version")
    created_at = serializers.DateTimeField(source="report_created_at")
    group = serializers.SerializerMethodField()
    group_id = serializers.SerializerMethodField()
    chemical_id = serializers.SerializerMethodField()
    chemical_name = serializers.SerializerMethodField()
    is_blend = serializers.SerializerMethodField()

    class Meta:
        model = AllPricesView
        fields = [
            "country_id",
            "country_name",
            "version",
            "created_at",
            "year",
            "report_status",
            "group",
            "group_id",
            "chemical_id",
            "chemical_name",
            "is_blend",
            "current_year_price",
            "is_retail",
            "is_fob",
        ]

    def get_group(self, obj):
        if obj.blend_id:
            return self.context["annex_f"].name
        return obj.substance_group_name

    def get_group_id(self, obj):
        if obj.blend_id:
            return self.context["annex_f"].id
        return obj.substance_group_id

    def get_chemical_id(self, obj):
        if obj.blend_id:
            return obj.blend_id
        return obj.substance_id

    def get_chemical_name(self, obj):
        if obj.blend_name:
            return obj.blend_name
        return obj.substance_name

    def get_is_blend(self, obj):
        if obj.blend_id:
            return True
        return False
