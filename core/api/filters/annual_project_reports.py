from django_filters import rest_framework as filters

from core.models import Project, Agency, Country, AnnualAgencyProjectReport


class APRProjectFilter(filters.FilterSet):
    year = filters.NumberFilter(method="filter_by_year", required=True)
    agency = filters.ModelChoiceFilter(queryset=Agency.objects.all(), required=True)
    status = filters.CharFilter(method="filter_by_status")

    class Meta:
        model = Project
        fields = ["year", "agency", "status"]

    def filter_by_year(self, queryset, _name, value):
        return queryset.filter(date_approved__year__lt=value)

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
        field_name="agency",
    )

    region = filters.ModelMultipleChoiceFilter(
        queryset=Country.objects.filter(location_type=Country.LocationType.REGION),
        field_name="project_reports__project__country__parent",
        distinct=True,
    )

    country = filters.ModelMultipleChoiceFilter(
        queryset=Country.objects.filter(location_type=Country.LocationType.COUNTRY),
        field_name="project_reports__project__country",
        distinct=True,
    )

    status = filters.CharFilter(method="filter_by_status")

    class Meta:
        model = AnnualAgencyProjectReport
        fields = ["agency", "region", "country", "status"]

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
