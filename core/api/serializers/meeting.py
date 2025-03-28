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
            "title",
            "status",
            "date",
            "end_date",
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
            "title",
            "number",
            "description",
        ]
