from django_filters import rest_framework as filters
from django_filters.widgets import CSVWidget

from core.models import Country
from core.models.country_programme import CPEmission, CPFile, CPPrices, CPRecord
from core.models.country_programme_archive import CPReportArchive


class CPReportFilter(filters.FilterSet):
    """
    Filter for country programme reports
    """

    country_id = filters.ModelMultipleChoiceFilter(
        field_name="country_id", queryset=Country.objects.all(), widget=CSVWidget
    )
    name = filters.CharFilter(field_name="name", lookup_expr="icontains")
    year = filters.RangeFilter(field_name="year")
    status = filters.CharFilter(method="filter_status")

    class Meta:
        fields = ["country_id", "name", "year", "status"]

    def filter_status(self, queryset, _name, value):
        if value == "all":
            return queryset
        return queryset.filter(status=value)


class CPReportArchiveFilter(filters.FilterSet):
    """
    Filter for cp report archive
    """

    country_id = filters.ModelMultipleChoiceFilter(
        field_name="country_id",
        queryset=Country.objects.all(),
        widget=CSVWidget,
        required=True,
    )
    year = filters.NumberFilter(field_name="year", required=True)

    class Meta:
        model = CPReportArchive
        fields = ["country_id", "year"]


class CPFileFilter(filters.FilterSet):
    """
    Filter for CP Files
    """

    country_id = filters.ModelChoiceFilter(
        required=True,
        queryset=Country.objects.all(),
        field_name="country_id",
    )
    year = filters.NumberFilter(required=True, field_name="year")

    class Meta:
        model = CPFile
        fields = ["country_id", "year"]


class CPAttributesBaseFilter(filters.FilterSet):
    """
    Base filter for country programme
    """

    country_id = filters.NumberFilter(
        required=False,
        field_name="country_programme_report__country_id",
    )
    year = filters.NumberFilter(
        required=False, field_name="country_programme_report__year"
    )
    min_year = filters.NumberFilter(
        required=False, field_name="country_programme_report__year", lookup_expr="gte"
    )
    max_year = filters.NumberFilter(
        required=False, field_name="country_programme_report__year", lookup_expr="lte"
    )

    class Meta:
        fields = ["country_id", "year", "min_year", "max_year"]


class CPRecordFilter(CPAttributesBaseFilter):
    """
    Filter for CP Records
    """

    class Meta(CPAttributesBaseFilter.Meta):
        model = CPRecord


class CPPricesFilter(CPAttributesBaseFilter):
    """
    Filter for CP Prices
    """

    class Meta(CPAttributesBaseFilter.Meta):
        model = CPPrices


class CPEmissionsFilter(CPAttributesBaseFilter):
    """
    Filter for CP Emissions
    """

    class Meta(CPAttributesBaseFilter.Meta):
        model = CPEmission
        fields = CPAttributesBaseFilter.Meta.fields
