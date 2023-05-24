from rest_framework import mixins, generics
from core.api.serializers import GroupSubstanceSerializer

from core.models.group import Group


class GroupSubstancesListAPIView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows usages to be viewed.
    @param with_usages: boolean - if true, return substances with excluded usages ids list
    """

    serializer_class = GroupSubstanceSerializer
    queryset = Group.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        with_usages = self.request.query_params.get("with_usages", None)
        if with_usages:
            queryset = queryset.prefetch_related("substances__excluded_usages")
        return queryset

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
