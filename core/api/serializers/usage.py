from rest_framework import serializers

from core.models import Usage


# pylint: disable=W0223, W0511
class RecursiveField(serializers.Serializer):
    def to_representation(self, instance):
        # create a new instance of the parent serializer
        serializer = self.parent.parent.__class__(instance, context=self.context)
        return serializer.data


class UsageSerializer(serializers.ModelSerializer):
    headerName = serializers.SerializerMethodField()
    children = RecursiveField(many=True, read_only=True)
    columnCategory = serializers.SerializerMethodField()
    dataType = serializers.SerializerMethodField()
    align = serializers.SerializerMethodField()  # we need this for exports

    class Meta:
        model = Usage
        fields = [
            "id",
            "headerName",
            "full_name",
            "sort_order",
            "children",
            "columnCategory",
            "dataType",
            "align",
        ]

    def get_headerName(self, obj):
        header_name = getattr(obj, "header_name", None)
        return header_name or obj.name

    def get_field(self, obj):
        usage_name = obj.full_name.lower().replace(" ", "_")
        return f"usage_{usage_name}"

    def get_columnCategory(self, _obj):
        return "usage"

    def get_dataType(self, _obj):
        return "object"

    def get_align(self, _obj):
        return "right"
