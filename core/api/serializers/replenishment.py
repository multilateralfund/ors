from rest_framework import serializers

from core.models import Replenishment


class ReplenishmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Replenishment
        fields = "__all__"
