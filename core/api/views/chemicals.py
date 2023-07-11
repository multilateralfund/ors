from decimal import Decimal
from django.db.models import Prefetch
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import mixins, generics, status
from rest_framework.response import Response


from core.api.serializers.chemicals import BlendSerializer, SubstanceSerializer
from core.api.utils import SECTION_ANNEX_MAPPING
from core.models.blend import Blend, BlendComponents
from core.models.substance import Substance
from core.models.usage import ExcludedUsage


class ChemicalBaseListView(mixins.ListModelMixin, generics.GenericAPIView):
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


class SubstancesListView(ChemicalBaseListView):
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


class BlendsListView(ChemicalBaseListView):
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


class BlendCreateView(generics.CreateAPIView):
    """
    API endpoint that allows blends to be created.
    """

    serializer_class = BlendSerializer
    queryset = Blend.objects.all()

    def create_response(self, blend_object):
        serializer = self.get_serializer(
            blend_object,
            context={
                "generate_composition": True,
            },
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def parse_blend_components_data(self, blend_components):
        """
        Validate components data and return blend components data
        ! if there is a validation error => return None, error_message

        @param components_data: list of tuples (substance_id, component_name, percentage)

        @return tuple: (blend_components_data, error_message)
            blend_components_data: dict or None
                {
                    "components": [
                            {
                            "component_name": component_name (string),
                            "percentage": percentage (float),
                            "substance_id": substance_id (int),
                            }
                        ],
                    "odp": odp (decimal),
                    "gwp": gwp (decimal),
                }
            error_message: string or None
        """

        components = []
        odp = 0
        gwp = 0
        percentage_sum = 0
        existing_subst = set()

        for subst_id, component_name, percentage in blend_components:
            prcnt_decimal = Decimal(percentage / 100)
            # get substance by id, if it does not exist return error
            try:
                subst = Substance.objects.select_related("group").get(id=subst_id)
            except Substance.DoesNotExist:
                return None, f"Substance with id {subst_id} does not exist"

            # check if component already exists in components dict
            if subst_id in existing_subst:
                # if component already exists and is not "other" return error
                return None, f"Substance with id {subst_id} already exists"

            if "other" in subst.name.lower() and not component_name:
                # components of "other" substances must have a specific name
                return (
                    None,
                    f"Please add a specific name for the component with id {subst_id}",
                )

            # add component to component list
            components.append(
                {
                    "component_name": component_name if component_name else subst.name,
                    "percentage": prcnt_decimal,
                    "substance_id": subst.id,
                    "percent_100": percentage,
                }
            )

            # add substance to existing substances list if it is not "other"
            if "other" not in subst.name.lower():
                existing_subst.add(subst_id)

            # set odp and gwp
            odp += subst.odp * prcnt_decimal

            # gwp is calculated only for substances from annex F
            if subst.group.annex == "F":
                gwp += subst.gwp * prcnt_decimal

            # set percentage_sum
            percentage_sum += percentage

        # check if percentage_sum is 100
        if percentage_sum != 100:
            return None, "Sum of percentages must be 100"

        return_data = {
            "components": components,
            "odp": odp,
            "gwp": gwp,
        }

        return return_data, None

    def get_blend_if_exists(self, data):
        """
        Check if a blend with the same name or components already exists

        @param data: dict

        @return: Blend object or None
        """
        blend = Blend.objects.find_by_name(name=data["other_names"])
        if blend:
            return blend

        blend_cmp = [
            (subst_id, prcnt / 100) for subst_id, _, prcnt in data["components"]
        ]
        blend = BlendComponents.objects.get_blend_by_components(blend_cmp)
        if blend:
            return blend

        return None

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["other_names", "components", "composition"],
            properties={
                "other_names": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Blend name",
                ),
                "components": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    description="List of tuples (substance_id, component_name, percentage)",
                    items=openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=[
                            openapi.Schema(
                                type=openapi.TYPE_INTEGER,
                                description="Substance id",
                            ),
                            openapi.Schema(
                                type=openapi.TYPE_STRING,
                                description="Component name",
                            ),
                            openapi.Schema(
                                type=openapi.TYPE_NUMBER,
                                description="Percentage",
                            ),
                        ],
                    ),
                ),
                "composition": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Plain-text description of the composition of the blend",
                ),
            },
        ),
    )
    def post(self, request, *args, **kwargs):
        data = request.data

        # check for existaing blend
        blend = self.get_blend_if_exists(data)
        if blend:
            return self.create_response(blend)

        # create new blend

        # parse blend components data
        components_data, error = self.parse_blend_components_data(data["components"])
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        # set name
        name = Blend.objects.get_next_cust_mx_name()

        # set composition
        # sort components by percentage
        composition = "; ".join(
            [
                f"{c['component_name']}-{c['percent_100']}%"
                for c in components_data["components"]
            ]
        )

        # create blend
        blend = Blend.objects.create(
            name=name,
            other_names=data["other_names"],
            composition=composition,
            composition_alt=data["composition"],
            type=Blend.BlendTypes.CUSTOM,
            odp=components_data["odp"],
            gwp=components_data["gwp"] if components_data["gwp"] else None,
            is_contained_in_polyols=False,
        )

        # create blend components
        blend_components = []
        for component in components_data["components"]:
            component.pop("percent_100")
            blend_components.append(
                BlendComponents(
                    blend=blend,
                    **component,
                )
            )

        BlendComponents.objects.bulk_create(blend_components)

        return self.create_response(blend)
