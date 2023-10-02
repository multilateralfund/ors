from rest_framework import serializers
from core.api.utils import SECTION_ANNEX_MAPPING

from core.models import Substance
from core.models import Blend


# pylint: disable=W0223
class ChemicalsBaseSerializer(serializers.ModelSerializer):
    def get_excluded_usages(self, obj):
        request = self.context.get("request")
        if request and request.query_params.get("with_usages", None):
            return [usage.usage_id for usage in obj.excluded_usages.all()]
        return []


# substance serializer with excluded usages if the request has a with_usages query param
class SubstanceSerializer(ChemicalsBaseSerializer):
    excluded_usages = serializers.SerializerMethodField()
    group_name = serializers.SlugField(source="group.name", read_only=True)
    annex_name = serializers.SlugField(source="group.annex", read_only=True)
    sections = serializers.SerializerMethodField()

    class Meta:
        model = Substance
        fields = [
            "id",
            "name",
            "group_id",
            "group_name",
            "annex_name",
            "sections",
            "formula",
            "odp",
            "is_contained_in_polyols",
            "displayed_in_all",
            "displayed_in_latest_format",
            "excluded_usages",
            "sort_order",
        ]

    def get_sections(self, obj):
        sections = []
        for section, annexes in SECTION_ANNEX_MAPPING.items():
            if obj.group.annex in annexes:
                sections.append(section)

        return sections


# blend serializer with excluded usages if the request has a with_usages query param
class BlendSerializer(ChemicalsBaseSerializer):
    excluded_usages = serializers.SerializerMethodField()
    composition = serializers.SerializerMethodField()

    class Meta:
        model = Blend
        fields = [
            "id",
            "name",
            "other_names",
            "type",
            "composition",
            "composition_alt",
            "odp",
            "gwp",
            "excluded_usages",
            "is_contained_in_polyols",
            "displayed_in_all",
            "displayed_in_latest_format",
            "sort_order",
        ]

    def get_composition(self, obj):
        """
        get the composition of the blend
        ! if the request has a generate_composition query param
            then the composition will be generated from the blend components
        """
        generate_composition = self.context.get("generate_composition", False)

        if generate_composition:
            # sort the components by percentage
            components = [
                (c.component_name, round(c.percentage * 100, 2))
                for c in obj.components.all()
            ]
            components.sort(key=lambda x: x[1], reverse=True)

            # return the composition string
            return "; ".join([f"{c[0]}-{c[1]}%" for c in components])

        return obj.composition
