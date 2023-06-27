from django.db.models import Prefetch
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import mixins, generics


from core.api.serializers.chemicals import BlendSerializer, SubstanceSerializer
from core.models.blend import Blend
from core.models.substance import Substance
from core.models.usage import ExcludedUsage


SECTION_ANNEX_MAPPING = {
    "A": ["A", "B", "C", "D", "E"],
    "B": ["F"],
    "C": ["C", "E", "F", "unknown"],
}


class ChemicalBaseListAPIView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows chemicals to be viewed.
    """

    serializer_class = None
    queryset = None
    select_related_string = None

    def get_queryset(self):
        queryset = super().get_queryset()

        if self.select_related_string:
            queryset = queryset.select_related(self.select_related_string)

        with_usages = self.request.query_params.get("with_usages", None)
        for_year = self.request.query_params.get("for_year", None)
        if with_usages:
            queryset = queryset.prefetch_related(
                Prefetch(
                    "excluded_usages",
                    queryset=ExcludedUsage.objects.get_for_year(for_year),
                ),
            )
        return queryset

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)


class SubstancesListAPIView(ChemicalBaseListAPIView):
    """
    API endpoint that allows substancesto be viewed.
    """

    serializer_class = SubstanceSerializer
    queryset = Substance.objects.all()
    select_related_string = "group"

    def get_queryset(self):
        queryset = super().get_queryset()

        section = self.request.query_params.get("section", None)
        if section:
            annexes = SECTION_ANNEX_MAPPING.get(section, [])
            queryset = queryset.filter(group__annex__in=annexes)

        return queryset.order_by("group__name", "sort_order")

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "section",
                openapi.IN_QUERY,
                description="Filter by section",
                type=openapi.TYPE_STRING,
                enum=["A", "B", "C"],
            ),
            openapi.Parameter(
                "with_usages",
                openapi.IN_QUERY,
                description="Add excluded usages ids list to the substances",
                type=openapi.TYPE_BOOLEAN,
            ),
            openapi.Parameter(
                "for_year",
                openapi.IN_QUERY,
                description=(
                    "year filter for excluded usages "
                    "(if true, add only excluded usages for this year)"
                ),
                type=openapi.TYPE_INTEGER,
            ),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class BlendsListAPIView(ChemicalBaseListAPIView):
    """
    API endpoint that allows blends to be viewed.
    @param with_usages: boolean - if true, return blends with excluded usages ids list
    @param for_year: integer - if with_usages is true, return excluded usages for this year
    """

    serializer_class = BlendSerializer
    queryset = Blend.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.order_by("sort_order")

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "with_usages",
                openapi.IN_QUERY,
                description="Add excluded usages ids list to the blends",
                type=openapi.TYPE_BOOLEAN,
            ),
            openapi.Parameter(
                "for_year",
                openapi.IN_QUERY,
                description=(
                    "Year filter for excluded usages "
                    "(if true, add only excluded usages for this year)"
                ),
                type=openapi.TYPE_INTEGER,
            ),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
