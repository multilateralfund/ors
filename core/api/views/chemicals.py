from django.db.models import Prefetch
from rest_framework import mixins, generics

from core.api.serializers import GroupSubstanceSerializer
from core.api.serializers.chemicals import BlendSerializer
from core.models.blend import Blend
from core.models.group import Group
from core.models.usage import ExcludedUsage


class ChemicalBaseListAPIView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows chemicals to be viewed.
    """

    serializer_class = None
    queryset = None
    prefetch_related_string = None

    def get_queryset(self):
        queryset = super().get_queryset()
        with_usages = self.request.query_params.get("with_usages", None)
        for_year = self.request.query_params.get("for_year", None)
        if with_usages:
            queryset = queryset.prefetch_related(
                Prefetch(
                    self.prefetch_related_string,
                    queryset=ExcludedUsage.objects.get_for_year(for_year),
                )
            )
        return queryset

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)


class GroupSubstancesListAPIView(ChemicalBaseListAPIView):
    """
    API endpoint that allows substances grouped by group to be viewed.
    @param with_usages: boolean - if true, return substances with excluded usages ids list
    @param for_year: integer - if with_usages is true, return excluded usages for this year
    """

    serializer_class = GroupSubstanceSerializer
    queryset = Group.objects
    prefetch_related_string = "substances__excluded_usages"

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.order_by("name")


class GroupSubstancesSectionCListView(GroupSubstancesListAPIView):
    """
    API endpoint that allows the substances needed for `Section C` to be viewed.
    The substances are grouped by group.
    This is a new view instead of a filter for the previous one because it will
    require some changes in the future that we don't know yet and we don't want
    to change the frontend later.
    """

    queryset = Group.objects.filter(annex__in=["C", "E", "F", "unknown"])


class BlendsListAPIView(ChemicalBaseListAPIView):
    """
    API endpoint that allows blends to be viewed.
    @param with_usages: boolean - if true, return blends with excluded usages ids list
    @param for_year: integer - if with_usages is true, return excluded usages for this year
    """

    serializer_class = BlendSerializer
    queryset = Blend.objects.all()
    prefetch_related_string = "excluded_usages"

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.order_by("sort_order")
