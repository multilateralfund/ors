from rest_framework import mixins, generics
from core.api.serializers import UsageSerializer

from core.models import Usage


class UsageListAPIView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows usages to be viewed.
    @param only_parents: boolean - if true, return only parent usages
    """

    serializer_class = UsageSerializer
    queryset = Usage.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        only_parents = self.request.query_params.get("only_parents", None)
        if only_parents:
            queryset = queryset.filter(parent=None)
        return queryset.order_by("sort_order")

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
