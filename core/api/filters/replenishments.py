from django_filters import rest_framework as filters

from core.models import ScaleOfAssessment


class ScaleOfAssessmentFilter(filters.FilterSet):
    """
    Filter for scale of assessment
    """

    start_year = filters.NumberFilter(field_name="version__replenishment__start_year")
    version = filters.NumberFilter(field_name="version__version")

    class Meta:
        model = ScaleOfAssessment
        fields = ["start_year", "version"]
