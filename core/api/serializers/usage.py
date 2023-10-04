from rest_framework import serializers

from core.models import Usage


# pylint: disable=W0223
class RecursiveField(serializers.Serializer):
    def to_representation(self, instance):
        serializer = self.parent.parent.__class__(instance, context=self.context)
        return serializer.data


class UsageSerializer(serializers.ModelSerializer):
    headerName = serializers.SerializerMethodField()
    children = RecursiveField(many=True, read_only=True)
    columnCategory = serializers.SerializerMethodField()
    dataType = serializers.SerializerMethodField()

    class Meta:
        model = Usage
        fields = [
            "id",
            "headerName",
            "full_name",
            "sort_order",
            "children",
            "columnCategory",
            "displayed_in_latest_format",
            "dataType",
        ]

    def get_headerName(self, obj):
        return obj.name

    def get_field(self, obj):
        usage_name = obj.full_name.lower().replace(" ", "_")
        return f"usage_{usage_name}"

    def get_columnCategory(self, _obj):
        return "usage"

    def get_dataType(self, _obj):
        return "object"
