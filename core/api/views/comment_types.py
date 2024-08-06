from rest_framework import generics

from core.api.serializers.base import CommentTypeSerializer
from core.models.base import CommentType


class CommentTypeListView(generics.ListAPIView):
    """
    List comment types.
    """

    queryset = CommentType.objects.all()
    serializer_class = CommentTypeSerializer
