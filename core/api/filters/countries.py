from django_filters import rest_framework as filters

from core.api.utils import RelatedExistsFilter
from core.models import Country


class CountryFilter(filters.FilterSet):
    """
    Filter for countries
    """

    with_cp_report = RelatedExistsFilter(field_name="cpreport_set")

    class Meta:
        model = Country
        fields = ["with_cp_report"]
