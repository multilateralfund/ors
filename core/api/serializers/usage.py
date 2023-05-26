from rest_framework import serializers

from core.models import Usage


class RecursiveField(serializers.Serializer):
    def to_representation(self, value):
        serializer = self.parent.parent.__class__(value, context=self.context)
        return serializer.data


class UsageSerializer(serializers.ModelSerializer):
    children = RecursiveField(many=True, read_only=True)

    class Meta:
        model = Usage
        fields = ["id", "name", "full_name", "sort_order", "children"]
