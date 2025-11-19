from django_filters import rest_framework as filters
from django_filters.fields import CSVWidget

from core.models import Project, Agency, Country, AnnualAgencyProjectReport


class APRProjectFilter(filters.FilterSet):
    year = filters.NumberFilter(method="filter_by_year", required=True)
    agency = filters.ModelChoiceFilter(queryset=Agency.objects.all(), required=True)
    status = filters.CharFilter(method="filter_by_status")

    class Meta:
        model = Project
        fields = ["year", "agency", "status"]

    def filter_by_year(self, queryset, _name, value):
        return queryset.filter(date_approved__year__lte=value)

    def filter_by_status(self, queryset, _name, value):
        """
        Accepts a comma-separated list, defaults to ongoing & completed,
        which are always included.
        """
        if not value:
            status_codes = ["ONG", "COM"]
        else:
            status_codes = [s.strip() for s in value.split(",") if s.strip()]

        mandatory_statuses = {"ONG", "COM"}
        status_codes = list(set(status_codes) | mandatory_statuses)

        return queryset.filter(status__code__in=status_codes)


class APRGlobalFilter(filters.FilterSet):
    """
    Filters for the MLFS "global" list view.
    """

    agency = filters.ModelMultipleChoiceFilter(
        queryset=Agency.objects.all(),
        widget=CSVWidget,
        distinct=True,
    )

    region = filters.ModelMultipleChoiceFilter(
        queryset=Country.objects.filter(
            location_type__in=[
                Country.LocationType.REGION,
                Country.LocationType.SUBREGION,
            ]
        ),
        to_field_name="name",
        widget=CSVWidget,
        method="filter_by_region",
    )

    country = filters.ModelMultipleChoiceFilter(
        queryset=Country.objects.filter(location_type=Country.LocationType.COUNTRY),
        to_field_name="name",
        widget=CSVWidget,
        distinct=True,
        method="filter_by_country",
    )

    cluster = filters.CharFilter(method="filter_by_cluster")

    status = filters.CharFilter(method="filter_by_status")

    class Meta:
        model = AnnualAgencyProjectReport
        fields = ["agency", "region", "country", "status", "cluster"]

    def filter_by_status(self, queryset, _name, value):
        """
        Accepts a comma-separated list, defaults to ongoing & completed,
        which are always included.
        """
        if not value:
            return queryset

        status_codes = [s.strip() for s in value.split(",") if s.strip()]
        valid_statuses = [
            choice[0] for choice in AnnualAgencyProjectReport.SubmissionStatus.choices
        ]
        status_codes = [s for s in status_codes if s in valid_statuses]

        if not status_codes:
            return queryset

        return queryset.filter(status__in=status_codes)

    def filter_by_region(self, queryset, _name, value):
        if not value:
            return queryset

        return queryset.filter(
            project_reports__project__country__parent__in=value
        ).distinct()

    def filter_by_country(self, queryset, _name, value):
        if not value:
            return queryset

        return queryset.filter(project_reports__project__country__in=value).distinct()

    def filter_by_cluster(self, queryset, _name, value):
        """
        Accepts a comma-separated list of cluster *names*.
        """
        if not value:
            return queryset

        cluster_names = [c.strip() for c in value.split(",") if c.strip()]
        if not cluster_names:
            return queryset

        return queryset.filter(
            project_reports__project__cluster__name__in=cluster_names
        ).distinct()
