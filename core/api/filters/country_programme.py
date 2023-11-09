from django_filters import rest_framework as filters
from django_filters.widgets import CSVWidget

from core.models import Country
from core.models.country_programme import CPReport
from core.models.country_programme_archive import CPReportArchive


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


class CPReportArchiveFilter(CPReportFilter):
    """
    Filter for cp report archive
    """

    country_programme_report_id = filters.NumberFilter(
        method="filter_by_country_programme_report_id"
    )

    def filter_by_country_programme_report_id(self, queryset, _, value):
        cp_report = CPReport.objects.filter(id=value).first()
        if not cp_report:
            return queryset.none()
        return queryset.filter(country_id=cp_report.country_id, year=cp_report.year)

    class Meta:
        model = CPReportArchive
        fields = CPReportFilter.Meta.fields + ["country_programme_report_id"]
