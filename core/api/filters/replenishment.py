from django_filters import rest_framework as filters
from django_filters.widgets import CSVWidget

from core.models import Country, Invoice, Payment, ScaleOfAssessment


class ScaleOfAssessmentFilter(filters.FilterSet):
    """
    FilterSet for Scale of Assessment
    """

    start_year = filters.NumberFilter(field_name="version__replenishment__start_year")
    version = filters.NumberFilter(field_name="version__version")

    class Meta:
        model = ScaleOfAssessment
        fields = ["start_year", "version"]


class InvoiceFilter(filters.FilterSet):
    """
    FilterSet for Invoice
    """

    country_id = filters.ModelMultipleChoiceFilter(
        field_name="country_id", queryset=Country.objects.all(), widget=CSVWidget
    )
    year = filters.NumberFilter(field_name="year")
    status = filters.CharFilter(method="filter_status")

    def filter_status(self, queryset, _name, value):
        if value == "pending":
            return queryset.filter(date_paid__isnull=True)
        if value == "paid":
            return queryset.filter(date_paid__isnull=False)
        return queryset

    class Meta:
        model = Invoice
        fields = ["country_id", "year", "status"]


class PaymentFilter(filters.FilterSet):
    """
    FilterSet for Payment
    """

    country_id = filters.ModelMultipleChoiceFilter(
        field_name="country_id", queryset=Country.objects.all(), widget=CSVWidget
    )
    year = filters.CharFilter(field_name="payment_for_year", lookup_expr="icontains")

    class Meta:
        model = Payment
        fields = ["country_id", "year"]
