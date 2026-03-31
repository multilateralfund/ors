from rest_framework import serializers

from core.api.serializers.meeting import DecisionSerializer
from core.api.serializers.meeting import MeetingSerializer
from core.models import Decision
from core.models import Meeting
from core.models.funding_window import FundingWindow


class FundingWindowSerializer(serializers.ModelSerializer):
    meeting = MeetingSerializer(read_only=True)
    decision = DecisionSerializer(read_only=True)

    meeting_id = serializers.PrimaryKeyRelatedField(
        source="meeting",
        queryset=Meeting.objects.all(),
        write_only=True,
    )
    decision_id = serializers.PrimaryKeyRelatedField(
        source="decision",
        queryset=Decision.objects.all(),
        write_only=True,
    )

    class Meta:
        model = FundingWindow
        fields = [
            "id",
            "meeting",
            "decision",
            "meeting_id",
            "decision_id",
            "description",
            "amount",
            "remarks",
        ]
