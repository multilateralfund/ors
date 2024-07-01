from decimal import Decimal
from django.db import transaction
from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import mixins, generics, status
from rest_framework.exceptions import ValidationError
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
    filter_backends = [DjangoFilterBackend]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["with_alt_names"] = self.request.query_params.get("with_alt_names", None)
        ctx["with_usages"] = self.request.query_params.get("with_usages", None)
        return ctx

    def get_queryset(self):
        queryset = super().get_queryset()

        if self.select_related_string:
            queryset = queryset.select_related(self.select_related_string)

        with_usages = self.request.query_params.get("with_usages", None)
        with_alt_names = self.request.query_params.get("with_alt_names", None)
        for_year = self.request.query_params.get("for_year", None)
        pref_related_fields = []

        if with_usages:
            pref_related_fields.append(
                Prefetch(
                    "excluded_usages",
                    queryset=ExcludedUsage.objects.get_for_year(for_year),
                )
            )
        if with_alt_names:
            pref_related_fields.append("alt_names")

        if pref_related_fields:
            queryset = queryset.prefetch_related(*pref_related_fields)
        return queryset

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)


class SubstancesListView(ChemicalBaseListView):
    """
    API endpoint that allows substances to be viewed.
    """

    serializer_class = SubstanceSerializer
    queryset = Substance.objects.all()
    select_related_string = "group"

    def get_queryset(self):
        queryset = super().get_queryset()

        # do not list legacy substances
        queryset = queryset.exclude(group__name__icontains="legacy")

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
                "with_alt_names",
                openapi.IN_QUERY,
                description="Add alternative names to the substances",
                type=openapi.TYPE_BOOLEAN,
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
    @param with_alt_names: boolean - if true, return blends with alternative names
    @param with_usages: boolean - if true, return blends with excluded usages ids list
    @param for_year: integer - if with_usages is true, return excluded usages for this year
    """

    serializer_class = BlendSerializer
    queryset = Blend.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        # do not list legacy blends
        queryset = queryset.exclude(is_legacy=True)

        return queryset.order_by("sort_order")

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "with_alt_names",
                openapi.IN_QUERY,
                description="Add alternative names to the blends",
                type=openapi.TYPE_BOOLEAN,
            ),
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


class SimilarBlendsListView(ChemicalBaseListView):
    """
    API endpoint that allows similar blends to be viewed.
    """

    serializer_class = BlendSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update(
            {
                "with_components": True,
                "generate_composition": True,
            }
        )
        return context

    def get_queryset(self):
        data = self.request.data

        queryset = BlendComponents.objects
        if not data.get("components", None):
            return queryset.none()

        components_list = [
            (vals["substance_id"], vals["percentage"] / 100)
            for vals in data["components"]
        ]
        queryset = queryset.get_suggested_blends(components_list)

        return queryset.order_by("sort_order")

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["components"],
            properties={
                "components": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    description="Array of objects",
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        required=["substance_id", "component_name", "percentage"],
                        properties={
                            "substance_id": openapi.Schema(
                                type=openapi.TYPE_INTEGER,
                                description="Substance id",
                            ),
                            "component_name": openapi.Schema(
                                type=openapi.TYPE_STRING,
                                description="Component name",
                            ),
                            "percentage": openapi.Schema(
                                type=openapi.TYPE_NUMBER,
                                description="Percentage",
                            ),
                        },
                    ),
                ),
            },
        ),
    )
    def post(self, request, *args, **kwargs):
        data = request.data
        self.serializer_class(data=data).validate_components(data)

        return self.list(request, *args, **kwargs)


class BlendCreateView(generics.CreateAPIView):
    """
    API endpoint that allows blends to be created.
    """

    serializer_class = BlendSerializer
    queryset = Blend.objects.all()

    def create_response(self, blend_object, created):
        data = self.get_serializer(
            blend_object,
            context={
                "generate_composition": True,
            },
        ).data
        data["created"] = created
        return Response(data, status=status.HTTP_200_OK)

    def parse_blend_components_data(self, blend_components):
        """
        Validate components data and return blend components data

        @param components_data: list of tuples (substance_id, component_name, percentage)

        @return dict: blend_components_data
            blend_components_data: dict
                {
                    "components": [
                            {
                            "component_name": component_name (string),
                            "percentage": percentage (float),
                            "substance_id": substance_id (int),
                            "row_id": used in error response (string),
                            }
                        ],
                    "odp": odp (decimal),
                    "gwp": gwp (decimal),
                }
        """

        components = []
        odp = 0
        gwp = 0
        percentage_sum = 0
        existing_subst = set()
        comp_errors = {}

        for index, vals in enumerate(blend_components):
            if not isinstance(vals, dict):
                raise ValidationError(
                    {"components": "There is a component that is not a dict"}
                )

            row_id = vals.pop("row_id", index)
            try:
                subst_id = vals.get("substance_id", None)
                component_name = vals.get("component_name", None)
                percentage = Decimal(str(vals["percentage"]))
                prcnt_decimal = percentage / 100
            except (ArithmeticError, TypeError, ValueError):
                comp_errors[row_id] = {"percentage": "Invalid value"}
                continue

            # get substance by id, if it does not exist return error
            try:
                subst = Substance.objects.select_related("group").get(id=subst_id)
            except Substance.DoesNotExist:
                comp_errors[row_id] = {"substance": "Substance does not exist."}
                continue

            # check if component already exists in components dict
            if subst_id in existing_subst:
                comp_errors[row_id] = {
                    "substance": "Substance already exists in the blend."
                }
                continue

            # add component to the component list
            components.append(
                {
                    "component_name": component_name if component_name else subst.name,
                    "percentage": prcnt_decimal,
                    "substance_id": subst.id,
                    "percent_100": percentage,
                }
            )

            # add substance to the existing substances list if it is not "other"
            existing_subst.add(subst_id)

            # set odp and gwp
            odp += subst.odp * prcnt_decimal

            # gwp is calculated only for substances from annex F
            if subst.group.annex == "F":
                gwp += subst.gwp * prcnt_decimal

            # set percentage_sum
            percentage_sum += percentage

        # check if there are any errors
        if comp_errors:
            raise ValidationError({"components": comp_errors})

        # check if percentage_sum is 100
        if percentage_sum != 100:
            raise ValidationError({"components": "Sum of percentages must be 100"})

        return {
            "components": components,
            "odp": odp,
            "gwp": gwp,
        }

    def get_blend_if_exists(self, data):
        """
        Check if a blend with the same name or components already exists

        @param data: dict

        @return: Blend object or None
        """
        if data.get("other_names", None):
            blend = Blend.objects.find_by_name(name=data["other_names"])
            if blend:
                return blend

        blend_cmp = [
            (vals["substance_id"], vals["percentage"] / 100)
            for vals in data["components"]
        ]
        blend = BlendComponents.objects.get_blend_by_components(blend_cmp)
        if blend:
            return blend

        return None

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["other_names", "components"],
            properties={
                "other_names": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Blend name",
                ),
                "components": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    description="Array of objects",
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        required=["substance_id", "component_name", "percentage"],
                        properties={
                            "substance_id": openapi.Schema(
                                type=openapi.TYPE_INTEGER,
                                description="Substance id",
                            ),
                            "component_name": openapi.Schema(
                                type=openapi.TYPE_STRING,
                                description="Component name",
                            ),
                            "percentage": openapi.Schema(
                                type=openapi.TYPE_NUMBER,
                                description="Percentage",
                            ),
                        },
                    ),
                ),
            },
        ),
    )
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        data = request.data

        self.serializer_class(data=data).validate_components(data)

        # parse blend components data
        components_data = self.parse_blend_components_data(data["components"])

        # check for existing blend
        blend = self.get_blend_if_exists(data)
        if blend:
            return self.create_response(blend, False)

        # create new blend

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
            other_names=data.get("other_names", None),
            composition=composition,
            type=Blend.BlendTypes.CUSTOM,
            odp=components_data["odp"],
            gwp=components_data["gwp"] if components_data["gwp"] else None,
            is_contained_in_polyols=False,
            created_by=request.user,
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

        return self.create_response(blend, True)


class BlendNextCustNameView(generics.RetrieveAPIView):
    """
    API endpoint that allows the next custom blend name to be viewed.
    """

    def get(self, request, *args, **kwargs):
        name = Blend.objects.get_next_cust_mx_name()
        return Response({"name": name}, status=status.HTTP_200_OK)
