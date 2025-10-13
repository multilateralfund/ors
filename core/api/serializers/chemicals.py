from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from core.api.utils import SECTION_ANNEX_MAPPING

from core.models import (
    Blend,
    Group,
    Substance,
)


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = [
            "id",
            "group_id",
            "annex",
            "name",
            "name_alt",
            "description",
            "description_alt",
            "is_odp",
            "is_gwp",
            "ozone_id",
        ]


# pylint: disable=W0223
class ChemicalsBaseSerializer(serializers.ModelSerializer):
    def get_alt_names(self, obj):
        if self.context.get("with_alt_names", False):
            return [alt_name.name for alt_name in obj.alt_names.all()]
        return []

    def get_excluded_usages(self, obj):
        if self.context.get("with_usages", False):
            return list({usage.usage_id for usage in obj.excluded_usages.all()})
        return []

    def get_chemical_note(self, obj):
        return obj.cp_report_note


# substance serializer with excluded usages if the request has a with_usages query param
class SubstanceSerializer(ChemicalsBaseSerializer):
    alt_names = serializers.SerializerMethodField()
    excluded_usages = serializers.SerializerMethodField()
    group = serializers.SlugField(source="group.name_alt", read_only=True)
    sections = serializers.SerializerMethodField()
    chemical_note = serializers.SerializerMethodField()
    created_by = serializers.StringRelatedField(
        read_only=True, source="created_by.username"
    )

    class Meta:
        model = Substance
        fields = [
            "id",
            "name",
            "alt_names",
            "group_id",
            "group",
            "sections",
            "formula",
            "odp",
            "gwp",
            "is_contained_in_polyols",
            "excluded_usages",
            "sort_order",
            "chemical_note",
            "created_by",
            "description",
        ]

    def get_sections(self, obj):
        sections = []
        if not obj.group:
            return []

        for section, annexes in SECTION_ANNEX_MAPPING.items():
            if obj.group.annex in annexes:
                sections.append(section)

        return sections


# blend serializer with excluded usages if the request has a with_usages query param
class BlendSerializer(ChemicalsBaseSerializer):
    alt_names = serializers.SerializerMethodField()
    excluded_usages = serializers.SerializerMethodField()
    composition = serializers.SerializerMethodField()
    group = serializers.SerializerMethodField()
    substance_groups = serializers.SerializerMethodField()
    components = serializers.SerializerMethodField()
    sections = serializers.SerializerMethodField()
    chemical_note = serializers.SerializerMethodField()

    class Meta:
        model = Blend
        fields = [
            "id",
            "name",
            "group",
            "other_names",
            "alt_names",
            "type",
            "composition",
            "composition_alt",
            "odp",
            "gwp",
            "excluded_usages",
            "is_contained_in_polyols",
            "sort_order",
            "components",
            "sections",
            "chemical_note",
            "is_legacy",
            "remarks",
            "substance_groups",
        ]

    def get_composition(self, obj):
        """
        get the composition of the blend
        ! if the request has a generate_composition query param
            then the composition will be generated from the blend components
        """
        generate_composition = self.context.get("generate_composition", False)

        if generate_composition:
            return obj.get_generated_composition()

        return obj.composition

    def get_components(self, obj):
        if not self.context.get("with_components", False):
            return []
        components = []
        for c in obj.components.all():
            components.append(
                {
                    "component_name": c.component_name,
                    "percentage": c.percentage * 100,
                    "substance_id": c.substance_id,
                }
            )
        return components

    def get_substance_groups(self, obj):
        """
        get the groups from the substances in the blend components
        """
        groups = set()
        for c in obj.components.all():
            if c.substance and c.substance.group:
                groups.add(c.substance.group.id)
        return list(groups)

    def get_group(self, obj):
        if obj.is_related_preblended_polyol:
            return "Other"
        return "Blends (Mixture of Controlled Substances)"

    def validate_components(self, attrs):
        if "components" not in attrs:
            raise ValidationError({"components": "This field is required"})
        try:
            assert isinstance(attrs["components"], list), "Components must be an array"
            assert len(attrs["components"]) > 0, "At least one component is required"
        except AssertionError as e:
            raise ValidationError({"components": str(e)}) from e
        return attrs

    def get_sections(self, *args):
        return ["B", "C"]
