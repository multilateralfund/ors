from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from core.models.blend import Blend
from core.models.country_programme import CPReport
from core.models.project import Project
from core.models.substance import Substance


CP_GENERATION_CHEMICAL = "HFC-23"


class RowIDField(serializers.CharField):
    def get_attribute(self, instance):
        # We pass the object instance onto `to_representation`,
        # not just the field attribute.
        return instance

    def to_representation(self, value):
        class_name = value.__class__.__name__

        if class_name == "CPGeneration":
            return "generation_1"
        if class_name == "CPEmission":
            return f"facility_{value.id}"
        if class_name == "CPUsage":
            return f"usage_{value.id}"
        # class_name in ["CPRecord", "CPPrice"]
        if getattr(value, "substance_id", None):
            return f"substance_{value.substance_id}"
        if getattr(value, "blend_id", None):
            return f"blend_{value.blend_id}"
        return "row_id_0"


class BaseCPRowSerializer(serializers.ModelSerializer):
    row_id = RowIDField(required=False)

    class Meta:
        fields = [
            "row_id",
        ]

    def to_internal_value(self, data):
        try:
            internal_value = super().to_internal_value(data)
        except ValidationError as e:
            # add chemical_id to error message
            row_id = data.get("row_id", "general_error")
            raport_error = {
                "row_id": row_id,
                "errors": e.detail,
            }
            raise ValidationError(raport_error) from e
        internal_value.pop("row_id", None)
        return internal_value


class BaseCPWChemicalSerializer(BaseCPRowSerializer):
    group = serializers.SerializerMethodField()
    chemical_name = serializers.SerializerMethodField()
    substance_id = serializers.PrimaryKeyRelatedField(
        required=False,
        allow_null=True,
        queryset=Substance.objects.all().values_list("id", flat=True),
    )
    blend_id = serializers.PrimaryKeyRelatedField(
        required=False,
        allow_null=True,
        queryset=Blend.objects.all().values_list("id", flat=True),
    )
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReport.objects.all().values_list("id", flat=True),
        write_only=True,
    )
    display_name = serializers.SerializerMethodField()
    chemical_sort_order = serializers.SerializerMethodField()

    class Meta:
        fields = BaseCPRowSerializer.Meta.fields + [
            "id",
            "country_programme_report_id",
            "display_name",
            "chemical_name",
            "substance_id",
            "blend_id",
            "group",
            "chemical_sort_order",
        ]

    def get_chemical_name(self, obj):
        return obj.substance.name if obj.substance else obj.blend.name

    def get_group(self, obj):
        if obj.blend:
            return "Blends (Mixture of Controlled Substances)"
        if obj.substance and obj.substance.group:
            return obj.substance.group.name_alt
        return None

    def get_display_name(self, obj):
        if obj.blend:
            return obj.blend.get_display_name()
        if obj.display_name:
            return obj.display_name
        return obj.substance.name

    def get_chemical_sort_order(self, obj):
        if obj.blend:
            return obj.blend.sort_order
        if obj.substance:
            return obj.substance.sort_order
        return None

    def validate(self, attrs):
        if not attrs.get("substance_id") and not attrs.get("blend_id"):
            raise serializers.ValidationError(
                "Either substance_id or blend_id is required"
            )
        if attrs.get("substance_id") and attrs.get("blend_id"):
            raise serializers.ValidationError(
                "Only one of substance_id or blend_id is required"
            )

        return super().validate(attrs)


class BaseProjectUtilityCreateSerializer(serializers.ModelSerializer):
    project_id = serializers.PrimaryKeyRelatedField(
        required=True, queryset=Project.objects.all().values_list("id", flat=True)
    )
