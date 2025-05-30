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
    chemical_note = serializers.SerializerMethodField()
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
            "chemical_note",
            "substance_id",
            "blend_id",
            "group",
            "chemical_sort_order",
        ]

    def get_chemical_name(self, obj):
        return obj.substance.name if obj.substance else obj.blend.name

    def get_chemical_note(self, obj):
        return (
            obj.substance.cp_report_note if obj.substance else obj.blend.cp_report_note
        )

    def get_group(self, obj):
        if obj.blend:
            if obj.blend.is_related_preblended_polyol:
                return "Other"
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


class BaseDashboardsSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source="report_year")
    version = serializers.IntegerField(source="report_version")
    created_at = serializers.DateTimeField(source="report_created_at")
    group = serializers.SerializerMethodField()
    group_id = serializers.SerializerMethodField()
    chemical_id = serializers.SerializerMethodField()
    chemical_name = serializers.SerializerMethodField()
    is_blend = serializers.SerializerMethodField()

    class Meta:
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
        ]

    def get_group(self, obj):
        if obj.blend_id:
            return self.context["annex_f"].name_alt
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
        return bool(obj.blend_id)


class BaseDashboardsEmissionsSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source="report_year")
    version = serializers.IntegerField(source="report_version")
    created_at = serializers.DateTimeField(source="report_created_at")
    data = serializers.SerializerMethodField()
    region = serializers.SerializerMethodField()
    substance_name = serializers.SerializerMethodField()
    substance_id = serializers.SerializerMethodField()
    object_type = serializers.SerializerMethodField()

    ATTRIBUTE_NAMES_MAPPING = {}

    class Meta:
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


class Many2ManyListField(serializers.ListField):
    # make ListField allow `ManyRelatedManager` data
    def to_representation(self, data):
        return [self.child.to_representation(item.pk) for item in data.all()]
