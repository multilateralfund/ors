from django_filters import rest_framework as filters

from core.models.base import CommentType


class CommentTypeFilter(filters.FilterSet):
    """
    Filter for comment types
    """

    class Meta:
        model = CommentType
        fields = ["name"]
