from rest_framework import serializers

from core.models.meeting import Decision, Meeting


class MeetingSerializer(serializers.ModelSerializer):
    """
    MeetingSerializer class
    """

    class Meta:
        model = Meeting
        fields = [
            "id",
            "number",
            "status",
            "date",
        ]


class DecisionSerializer(serializers.ModelSerializer):
    """
    DecisionSerializer class
    """

    class Meta:
        model = Decision
        fields = [
            "id",
            "meeting_id",
            "number",
            "description",
        ]
