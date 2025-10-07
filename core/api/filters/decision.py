from django_filters import rest_framework as filters
from django_filters.fields import CSVWidget

from core.models import Meeting


class DecisionFilter(filters.FilterSet):
    meeting_id = filters.ModelMultipleChoiceFilter(
        field_name="meeting_id",
        queryset=Meeting.objects.all(),
        widget=CSVWidget,
    )
