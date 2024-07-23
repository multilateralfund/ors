from django_filters import rest_framework as filters
from django_filters.widgets import CSVWidget

from core.models import Country, Invoice, Payment, ScaleOfAssessment


class ScaleOfAssessmentFilter(filters.FilterSet):
    """
    FilterSet for Scale of Assessment
    """

    start_year = filters.NumberFilter(field_name="replenishment__start_year")

    class Meta:
        model = ScaleOfAssessment
        fields = ["start_year"]


class InvoiceFilter(filters.FilterSet):
    """
    FilterSet for Invoice
    """

    country_id = filters.ModelMultipleChoiceFilter(
        field_name="country_id", queryset=Country.objects.all(), widget=CSVWidget
    )
    replenishment_start = filters.NumberFilter(method="filter_replenishment_start")

    class Meta:
        model = Invoice
        fields = ["country_id", "replenishment_start"]

    def filter_replenishment_start(self, queryset, _name, value):
        """
        Filters by start year of replenishment
        """
        if value == "all":
            return queryset
        return queryset.filter(replenishment__start_year=int(value))


class PaymentFilter(filters.FilterSet):
    """
    FilterSet for Payment
    """

    country_id = filters.ModelMultipleChoiceFilter(
        field_name="country_id", queryset=Country.objects.all(), widget=CSVWidget
    )

    class Meta:
        model = Payment
        fields = ["country_id"]
