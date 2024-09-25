from django_filters import rest_framework as filters
from django_filters.widgets import CSVWidget
from django.db.models import OuterRef, Subquery

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

    reminders_sent = filters.NumberFilter(method="filter_reminders_sent")
    opted_for_ferm = filters.BooleanFilter(method="filter_opted_for_ferm")

    def filter_status(self, queryset, _name, value):
        if value == "pending":
            return queryset.filter(date_paid__isnull=True)
        if value == "paid":
            return queryset.filter(date_paid__isnull=False)
        return queryset

    def filter_reminders_sent(self, queryset, _name, value):
        if value == 0:
            return queryset.filter(
                date_first_reminder__isnull=True, date_second_reminder__isnull=True
            )
        elif value == 1:
            return queryset.filter(
                date_first_reminder__isnull=False, date_second_reminder__isnull=True
            )
        elif value == 2:
            return queryset.filter(
                date_first_reminder__isnull=False, date_second_reminder__isnull=False
            )

        return queryset

    def filter_opted_for_ferm(self, queryset, _name, value):
        # `queryset` is of Invoice
        ret = queryset.annotate(
            opted_for_ferm=Subquery(
                ScaleOfAssessment.objects.filter(
                    country=OuterRef("country"),
                    version__replenishment__start_year__lte=OuterRef("year"),
                    version__replenishment__end_year__gte=OuterRef("year"),
                ).values("opted_for_ferm")[:1]
            )
        ).filter(opted_for_ferm=value)

        return ret

    class Meta:
        model = Invoice
        fields = ["country_id", "year", "status", "reminders_sent"]


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
