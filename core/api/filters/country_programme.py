from django_filters import rest_framework as filters
from django_filters.widgets import CSVWidget

from core.models import Country
from core.models.country_programme import CPReport


class CPReportFilter(filters.FilterSet):
    """
    Filter for country programme reports
    """

    country_id = filters.ModelMultipleChoiceFilter(
        field_name="country_id",
        queryset=Country.objects.all(),
        widget=CSVWidget,
    )
    name = filters.CharFilter(field_name="name", lookup_expr="icontains")
    year = filters.RangeFilter(field_name="year")
    status = filters.ChoiceFilter(choices=CPReport.CPReportStatus.choices)

    class Meta:
        model = CPReport
        fields = ["country_id", "name", "year", "status"]
