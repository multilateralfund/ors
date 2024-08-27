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
    year = filters.NumberFilter(field_name="year", required=True)

    class Meta:
        model = Invoice
        fields = ["country_id", "year"]


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
