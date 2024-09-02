from rest_framework import generics

from core.api.filters.comment_type import CommentTypeFilter
from core.api.serializers.base import CommentTypeSerializer
from core.models.base import CommentType


class CommentTypeListView(generics.ListAPIView):
    """
    List comment types.
    """

    queryset = CommentType.objects.all()
    filterset_class = CommentTypeFilter
    serializer_class = CommentTypeSerializer
