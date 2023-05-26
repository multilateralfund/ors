from rest_framework import serializers

from core.models import Usage


# pylint: disable=W0223
class RecursiveField(serializers.Serializer):
    def to_representation(self, instance):
        serializer = self.parent.parent.__class__(instance, context=self.context)
        return serializer.data


class UsageSerializer(serializers.ModelSerializer):
    children = RecursiveField(many=True, read_only=True)

    class Meta:
        model = Usage
        fields = ["id", "name", "sort_order", "children"]
