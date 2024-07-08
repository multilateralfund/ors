from django_filters import rest_framework as filters

from core.models import ScaleOfAssessment


class ScaleOfAssessmentFilter(filters.FilterSet):
    """
    Filter for contributions
    """

    start_year = filters.NumberFilter(field_name="replenishment__start_year")

    class Meta:
        model = ScaleOfAssessment
        fields = ["start_year"]
