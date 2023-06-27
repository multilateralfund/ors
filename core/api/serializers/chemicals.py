from rest_framework import serializers

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

    class Meta:
        model = Substance
        fields = [
            "id",
            "name",
            "group_id",
            "group_name",
            "formula",
            "odp",
            "is_contained_in_polyols",
            "is_captured",
            "excluded_usages",
            "sort_order",
        ]


# blend serializer with excluded usages if the request has a with_usages query param
class BlendSerializer(ChemicalsBaseSerializer):
    excluded_usages = serializers.SerializerMethodField()

    class Meta:
        model = Blend
        fields = [
            "id",
            "name",
            "other_names",
            "excluded_usages",
            "sort_order",
        ]
