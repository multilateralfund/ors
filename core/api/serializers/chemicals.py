from rest_framework import serializers

from core.models import Substance
from core.models import Group


# substance serializer with excluded usages if the request has a with_usages query param
class SubstanceSerializer(serializers.ModelSerializer):
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

    def get_excluded_usages(self, obj):
        request = self.context.get("request")
        if request and request.query_params.get("with_usages", None):
            return [usage.id for usage in obj.excluded_usages.all()]
        return []


class GroupSubstanceSerializer(serializers.ModelSerializer):
    substances = SubstanceSerializer(many=True, read_only=True)

    class Meta:
        model = Group
        fields = ["id", "name", "name_alt", "substances"]
