from django_filters import rest_framework as filters

from core.models import Agency
from core.models import MetaProject
from django_filters.fields import CSVWidget

class MetaProjectMyaFilter(filters.FilterSet):
    """
    Filter for meta projects
    """

    lead_agency_id = filters.ModelMultipleChoiceFilter(
        field_name="lead_agency",
        queryset=Agency.objects.all(),
        widget=CSVWidget,
    )

    class Meta:
        model = MetaProject
        fields = ["code", "type", "lead_agency_id"]
