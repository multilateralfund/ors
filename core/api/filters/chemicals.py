from django_filters import rest_framework as filters


class ChemicalFilter(filters.FilterSet):
    """
    Filter for country programme reports
    """

    displayed_in_all = filters.BooleanFilter(
        field_name="displayed_in_all", lookup_expr="exact"
    )
    displayed_in_latest_format = filters.BooleanFilter(
        field_name="displayed_in_latest_format", lookup_expr="exact"
    )

    class Meta:
        fields = ["displayed_in_all", "displayed_in_latest_format"]
