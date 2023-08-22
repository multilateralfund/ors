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
    cellEditor = serializers.SerializerMethodField()
    cellEditorParams = serializers.SerializerMethodField()
    field = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()

    class Meta:
        model = Usage
        fields = [
            "id",
            "headerName",
            "sort_order",
            "children",
            "cellEditor",
            "cellEditorParams",
            "field",
            "type",
        ]

    def get_headerName(self, obj):
        return obj.full_name

    def get_cellEditor(self, _obj):
        return "agNumberCellEditor"

    def get_cellEditorParams(self, _obj):
        return {"min": "0"}

    def get_field(self, obj):
        usage_name = obj.full_name.lower().replace(" ", "_")
        return f"usage_{usage_name}"

    def get_type(self, _obj):
        return "usages"
