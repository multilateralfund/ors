from django_filters import rest_framework as filters
from django_filters.widgets import CSVWidget

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
    status = filters.ChoiceFilter(choices=CPReport.CPReportStatus.choices)

    class Meta:
        model = CPReport
        fields = ["country_id", "name", "year", "status"]


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


class CPPricesFilter(filters.FilterSet):
    """
    Filter for CP Prices
    """

    country_id = filters.ModelChoiceFilter(
        required=True,
        queryset=Country.objects.all(),
        field_name="country_programme_report__country_id",
    )
    year = filters.NumberFilter(
        required=True, field_name="country_programme_report__year"
    )

    class Meta:
        model = CPPrices
        fields = ["country_id", "year"]


class CPFileFilter(CPPricesFilter):
    """
    Filter for CP Files
    """

    class Meta:
        model = CPFile
        fields = ["country_id", "year"]
