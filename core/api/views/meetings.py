from rest_framework import generics

from core.api.serializers.meeting import MeetingSerializer
from core.models.meeting import Meeting


class MeetingListView(generics.ListAPIView):
    queryset = Meeting.objects.order_by("number").all()
    serializer_class = MeetingSerializer
