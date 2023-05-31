from django_filters import rest_framework as filters

from core.models.country_programme import CountryProgrammeRecord, CountryProgrammeReport


class CountryProgrammeReportFilter(filters.FilterSet):
    """
    Filter for country programme reports
    """

    country_id = filters.NumberFilter(field_name="country_id", lookup_expr="exact")
    name = filters.CharFilter(field_name="name", lookup_expr="icontains")
    year = filters.NumberFilter(field_name="year", lookup_expr="exact")

    class Meta:
        model = CountryProgrammeReport
        fields = ["country_id", "name", "year"]


class CountryProgrammeRecordFilter(filters.FilterSet):
    """
    Filter for country programme records
    """

    country_programme_report_id = filters.NumberFilter(
        field_name="country_programme_report_id", lookup_expr="exact"
    )
    substance_id = filters.NumberFilter(field_name="substance_id", lookup_expr="exact")
    blend_id = filters.NumberFilter(field_name="blend_id", lookup_expr="exact")
    section = filters.CharFilter(field_name="section", lookup_expr="iexact")
    country_id = filters.NumberFilter(
        field_name="country_programme_report__country_id", lookup_expr="exact"
    )
    year = filters.NumberFilter(
        field_name="country_programme_report__year", lookup_expr="exact"
    )

    class Meta:
        model = CountryProgrammeRecord
        fields = [
            "country_programme_report_id",
            "substance_id",
            "blend_id",
            "section",
            "country_id",
            "year",
        ]
