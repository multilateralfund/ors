from rest_framework import serializers

from core.models import Substance
from core.models import Group
from core.models import Blend

class ChemicalsBaseSerializer(serializers.ModelSerializer):

    def get_excluded_usages(self, obj):
            request = self.context.get("request")
            if request and request.query_params.get("with_usages", None):
                return [usage.usage_id for usage in obj.excluded_usages.all()]
            return []

# substance serializer with excluded usages if the request has a with_usages query param
class SubstanceSerializer(ChemicalsBaseSerializer):
    excluded_usages = serializers.SerializerMethodField()

    class Meta:
        model = Substance
        fields = [
            "id",
            "name",
            "formula",
            "odp",
            "is_contained_in_polyols",
            "is_captured",
            "excluded_usages",
            "sort_order",
        ]


class GroupSubstanceSerializer(serializers.ModelSerializer):
    substances = SubstanceSerializer(many=True, read_only=True)

    class Meta:
        model = Group
        fields = ["id", "name", "name_alt", "substances"]

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