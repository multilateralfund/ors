from django_filters import rest_framework as filters
from django_filters.fields import CSVWidget

from core.models import Agency
from core.models import Country
from core.models import MetaProject
from core.models import ProjectCluster


class MetaProjectMyaFilter(filters.FilterSet):
    """
    Filter for meta projects
    """

    lead_agency_id = filters.ModelMultipleChoiceFilter(
        field_name="lead_agency",
        queryset=Agency.objects.all(),
        widget=CSVWidget,
    )

    country_id = filters.ModelMultipleChoiceFilter(
        field_name="projects__country",
        queryset=Country.objects.all(),
        widget=CSVWidget,
    )

    cluster_id = filters.ModelMultipleChoiceFilter(
        field_name="projects__cluster",
        queryset=ProjectCluster.objects.all(),
        widget=CSVWidget,
    )

    class Meta:
        model = MetaProject
        fields = [
            "code",
            "type",
            "country_id",
            "lead_agency_id",
            "cluster_id",
        ]
