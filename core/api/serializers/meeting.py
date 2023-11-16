from rest_framework import serializers

from core.models.meeting import Meeting


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
