from django_filters import rest_framework as filters

from core.models import Contribution


class ContributionFilter(filters.FilterSet):
    """
    Filter for contributions
    """

    start_year = filters.NumberFilter(field_name="replenishment__start_year")

    class Meta:
        model = Contribution
        fields = ["start_year"]
