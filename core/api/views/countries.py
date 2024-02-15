from rest_framework import mixins, generics

from core.api.filters.countries import CountryFilter
from core.api.serializers import CountrySerializer
from core.models import Country


class CountryListView(mixins.ListModelMixin, generics.GenericAPIView):
    """
    API endpoint that allows countries to be viewed.
    """

    serializer_class = CountrySerializer
    queryset = Country.objects.with_has_cp_report().order_by("name")
    filterset_class = CountryFilter

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
