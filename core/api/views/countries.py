from rest_framework import mixins, generics

from core.api.filters.countries import CountryFilter
from core.api.serializers import CountrySerializer
from core.models import Country


class CountryListView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows countries to be viewed.
    """

    serializer_class = CountrySerializer
    filterset_class = CountryFilter

    def get_queryset(self):
        user = self.request.user
        queryset = Country.objects.with_has_cp_report().filter(
            is_a2=False,
        )
        if user.user_type in (
            user.UserType.COUNTRY_USER,
            user.UserType.COUNTRY_SUBMITTER,
        ):
            queryset = queryset.filter(id=user.country_id)
        return queryset.order_by("name")

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
