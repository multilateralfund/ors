from django_filters import rest_framework as filters

from core.models import Project, Agency


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
