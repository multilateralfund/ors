from django.db.models import Q
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

    individual_consideration = filters.MultipleChoiceFilter(
        field_name="projects__individual_consideration",
        choices=[
            ("Individual consideration", True),
            ("Blanket", False),
            ("N/A", None),
        ],
        widget=CSVWidget,
        method="filter_individual_consideration",
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

    ordering = filters.OrderingFilter(
        fields=(
            ("projects__country__name", "country__name"),
            ("projects__cluster__code", "cluster__code"),
            "lead_agency__name",
            "new_code",
            "type",
        ),
        field_labels={
            "country__name": "Country",
            "cluster__code": "Cluster code",
            "lead_agency__name": "Lead agency",
            "new_code": "Code",
            "type": "Type",
        },
    )

    def filter_individual_consideration(self, queryset, name, value):
        if not value:
            return queryset
        query_filters = Q()
        for option in value:
            if option.lower() == "individual consideration":
                query_filters |= Q(**{name: True})
            elif option.lower() == "blanket":
                query_filters |= Q(**{name: False})
            elif option.lower() == "n/a":
                query_filters |= Q(**{f"{name}__isnull": True})
        if not query_filters:
            return queryset
        return queryset.filter(query_filters)
