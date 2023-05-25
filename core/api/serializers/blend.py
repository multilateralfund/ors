from rest_framework import serializers

from core.models import Blend

# blend serializer with excluded usages if the request has a with_usages query param
class BlendSerializer(serializers.ModelSerializer):
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

    def get_excluded_usages(self, obj):
        request = self.context.get("request")
        if request and request.query_params.get("with_usages", None):
            return [usage.usage_id for usage in obj.excluded_usages.all()]
        return []