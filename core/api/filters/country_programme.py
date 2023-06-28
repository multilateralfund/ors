from django_filters import rest_framework as filters

from core.models.country_programme import CPReport


class CPReportFilter(filters.FilterSet):
    """
    Filter for country programme reports
    """

    country_id = filters.NumberFilter(field_name="country_id", lookup_expr="exact")
    name = filters.CharFilter(field_name="name", lookup_expr="icontains")
    year = filters.NumberFilter(field_name="year", lookup_expr="exact")

    class Meta:
        model = CPReport
        fields = ["country_id", "name", "year"]
