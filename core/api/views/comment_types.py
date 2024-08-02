from rest_framework import mixins, generics

from core.api.serializers.base import CommentTypeSerializer
from core.models.base import CommentType


class CommentTypeListView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint to list comment types.
    """

    queryset = CommentType.objects.all()
    serializer_class = CommentTypeSerializer
