from django_filters import rest_framework as filters

from core.models.country_programme import CountryProgrammeReport


class CountryProgrammeReportFilter(filters.FilterSet):
    """
    Filter for country programme reports
    """

    country_id = filters.NumberFilter(field_name="country__id", lookup_expr="exact")
    name = filters.CharFilter(field_name="name", lookup_expr="icontains")
    year = filters.NumberFilter(field_name="year", lookup_expr="exact")

    class Meta:
        model = CountryProgrammeReport
        fields = ["country_id", "name", "year"]
