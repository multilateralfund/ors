from django_filters import rest_framework as filters
from django_filters.widgets import CSVWidget

from core.model_views.country_programme import (
    AllCPRecordsView,
    AllEmissionsView,
    AllPricesView,
)
from core.models import Country
from core.models.country_programme import CPFile, CPPrices, CPReport
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

    country_id = filters.NumberFilter()
    year = filters.NumberFilter(required=False, field_name="report_year")
    min_year = filters.NumberFilter(
        required=False, field_name="report_year", lookup_expr="gte"
    )
    max_year = filters.NumberFilter(
        required=False, field_name="report_year", lookup_expr="lte"
    )
    status = filters.CharFilter(
        field_name="report_status",
        lookup_expr="exact",
        help_text="Filter by report status (Draft / Final)",
    )

    def __init__(self, data=None, queryset=None, *, request=None, prefix=None):
        # set default value for status filter
        data = data.copy() if data else {}
        if "status" not in data:
            data["status"] = CPReport.CPReportStatus.FINAL
        super().__init__(data, queryset, request=request, prefix=prefix)

    class Meta:
        fields = ["country_id", "year", "min_year", "max_year"]


class CPPricesFilter(CPAttributesBaseFilter):
    """
    Filter for CP Prices
    """

    class Meta(CPAttributesBaseFilter.Meta):
        model = CPPrices


class DashboardsCPRecordFilter(CPAttributesBaseFilter):
    """
    Filter for CP Records
    """

    class Meta(CPAttributesBaseFilter.Meta):
        model = AllCPRecordsView


class DashboardsCPPricesFilter(CPAttributesBaseFilter):
    """
    Filter for CP Prices View
    CP All Prices View is a db view that is a union of the cp_prices, cp_prices_archive tables
    """

    class Meta(CPAttributesBaseFilter.Meta):
        model = AllPricesView
        fields = CPAttributesBaseFilter.Meta.fields
