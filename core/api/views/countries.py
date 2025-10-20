from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from rest_framework import mixins, generics

from core.api.filters.countries import CountryFilter
from core.api.serializers import CountryDetailsSerializer
from core.models import Country, MetaProject


class CountryListView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows countries to be viewed.
    """

    serializer_class = CountryDetailsSerializer
    filterset_class = CountryFilter

    def get_queryset(self):
        user = self.request.user
        queryset = (
            Country.objects.with_has_cp_report()
            .filter(
                is_a2=False,
            )
            .select_related("parent")
        )

        values_exclusive_for = self.request.query_params.get(
            "values_exclusive_for", None
        )

        if values_exclusive_for == "projects":
            queryset = queryset.filter(
                location_type="Country",
            )
        elif values_exclusive_for == "business_plan":
            queryset = Country.get_business_plan_countries()
        elif values_exclusive_for == "replenishment":
            queryset = Country.objects.all()
        elif values_exclusive_for == "meta_project":
            if not user.has_perm("core.has_meta_projects_view_access"):
                queryset = Country.objects.none()
            else:
                meta_projects = MetaProject.objects.filter(
                    type=MetaProject.MetaProjectType.MYA,
                    projects__submission_status__name="Approved",
                ).distinct()

                queryset = Country.objects.filter(
                    project__meta_project__in=meta_projects
                ).distinct()
        elif values_exclusive_for == "all":
            queryset = Country.objects.all()
        if user.has_perm("core.can_view_only_own_country") and not user.has_perm(
            "core.can_view_all_countries"
        ):
            queryset = queryset.filter(id=user.country_id)

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "values_exclusive_for",
                openapi.IN_QUERY,
                description="Give the module for which the countries are being requested",
                type=openapi.TYPE_STRING,
                enum=[
                    "business_plan",
                    "meta-project",
                    "projects",
                    "replenishment",
                    "all",
                ],
            ),
        ],
    )
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)


class BusinessPlanCountryListView(CountryListView):
    """
    API endpoint that allows countries to be viewed for business plan users.
    """

    def get_queryset(self):
        user = self.request.user
        queryset = Country.get_business_plan_countries()
        if user.has_perm("core.can_view_only_own_country") and not user.has_perm(
            "core.can_view_all_countries"
        ):
            queryset = queryset.filter(id=user.country_id)
        return queryset.order_by("name")
