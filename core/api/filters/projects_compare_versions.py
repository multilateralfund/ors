from django_filters import rest_framework as filters

from core.models import Project


class ProjectsCompareVersionsFilter(filters.FilterSet):
    """
    Filter for projects
    """

    meeting_id = filters.NumberFilter(field_name="meeting")

    class Meta:
        model = Project
        fields = [
            "meeting_id",
        ]
