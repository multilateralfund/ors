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
        ]

    def get_headerName(self, obj):
        # TODO add a new table to store the alternative names
        if obj.name == "Refrigeration":
            for_year = self.context.get("for_year", None)
            section = self.context.get("section", None)
            if for_year and section and for_year > 2022 and section == "B":
                return "Refrigeration and Air Conditioning"

        return obj.name

    def get_field(self, obj):
        usage_name = obj.full_name.lower().replace(" ", "_")
        return f"usage_{usage_name}"

    def get_columnCategory(self, _obj):
        return "usage"

    def get_dataType(self, _obj):
        return "object"
