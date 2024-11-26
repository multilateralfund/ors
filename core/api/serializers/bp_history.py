from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.models.business_plan import BPHistory, BusinessPlan

User = get_user_model()


class BPHistorySerializer(serializers.ModelSerializer):
    business_plan_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=BusinessPlan.objects.all().values_list("id", flat=True),
        write_only=True,
    )
    updated_by_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=User.objects.all().values_list("id", flat=True),
        write_only=True,
    )
    updated_by_username = serializers.StringRelatedField(
        read_only=True,
        source="updated_by.username",
    )

    class Meta:
        model = BPHistory
        fields = [
            "id",
            "business_plan_id",
            "created_at",
            "updated_by_id",
            "updated_by_username",
            "event_description",
            "bp_version",
        ]
