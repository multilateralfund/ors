from rest_framework import generics

from core.api.filters.decision import DecisionFilter
from core.api.serializers.meeting import DecisionSerializer, MeetingSerializer
from core.models.meeting import Decision, Meeting


class MeetingListView(generics.ListAPIView):
    queryset = Meeting.objects.order_by("number")
    serializer_class = MeetingSerializer


class DecisionListView(generics.ListAPIView):
    queryset = Decision.objects.select_related("meeting").order_by("number")
    serializer_class = DecisionSerializer
    filterset_class = DecisionFilter
