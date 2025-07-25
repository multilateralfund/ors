from rest_framework import mixins, generics

from core.api.filters.countries import CountryFilter
from core.api.serializers import CountryDetailsSerializer
from core.models import Country


class CountryListView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows countries to be viewed.
    """

    serializer_class = CountryDetailsSerializer
    filterset_class = CountryFilter

    def get_queryset(self):
        user = self.request.user
        queryset = Country.objects.filter(
            is_a2=False,
        ).select_related("parent")
        if user.has_perm("core.can_view_only_own_country") and not user.has_perm(
            "core.can_view_all_countries"
        ):
            queryset = queryset.filter(id=user.country_id)
        return queryset.order_by("name")

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
