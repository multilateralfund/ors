from rest_framework import mixins, generics
from core.api.serializers import BlendSerializer

from core.models.blend import Blend


class BlendsListAPIView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows blends to be viewed.
    @param with_usages: boolean - if true, return blends with excluded usages ids list
    """

    serializer_class = BlendSerializer
    queryset = Blend.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        with_usages = self.request.query_params.get("with_usages", None)
        if with_usages:
            queryset = queryset.prefetch_related("excluded_usages")
        return queryset.order_by("sort_order")

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)