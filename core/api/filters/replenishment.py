from django_filters import rest_framework as filters
from django_filters.widgets import CSVWidget
from django.db.models import Subquery

from core.models import (
    Country,
    Invoice,
    Payment,
    Replenishment,
    ScaleOfAssessment,
    ScaleOfAssessmentVersion,
)


class ScaleOfAssessmentFilter(filters.FilterSet):
    """
    FilterSet for Scale of Assessment
    """

    country_id = filters.ModelMultipleChoiceFilter(
        field_name="country_id", queryset=Country.objects.all(), widget=CSVWidget
    )
    start_year = filters.NumberFilter(field_name="version__replenishment__start_year")
    version = filters.NumberFilter(field_name="version__version")
    is_final = filters.BooleanFilter(field_name="version__is_final")

    class Meta:
        model = ScaleOfAssessment
        fields = ["country_id", "start_year", "version", "is_final"]


class ReplenishmentFilter(filters.FilterSet):
    """
    FilterSet for Replenishment
    """

    is_final = filters.BooleanFilter(method="filter_is_final")

    def filter_is_final(self, queryset, _name, value):
        if value is True:
            return queryset.filter(
                scales_of_assessment_versions__pk__in=Subquery(
                    ScaleOfAssessmentVersion.objects.exclude(is_final=False).values(
                        "pk"
                    )
                )
            )
        return queryset

    class Meta:
        model = Replenishment
        fields = ["is_final"]


class InvoiceFilter(filters.FilterSet):
    """
    FilterSet for Invoice
    """

    country_id = filters.ModelMultipleChoiceFilter(
        field_name="country_id", queryset=Country.objects.all(), widget=CSVWidget
    )
    year = filters.RangeFilter(field_name="year")
    status = filters.CharFilter(method="filter_status")

    reminders_sent = filters.NumberFilter(method="filter_reminders_sent")
    opted_for_ferm = filters.BooleanFilter(field_name="is_ferm")

    def filter_status(self, queryset, _name, value):
        if value == "pending":
            return queryset.filter(date_paid__isnull=True)
        if value == "paid":
            return queryset.filter(date_paid__isnull=False)
        return queryset

    def filter_reminders_sent(self, queryset, _name, value):
        # pylint: disable-next=R1705
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
    year = filters.CharFilter(method="filter_year")

    def filter_year(self, queryset, _name, value):
        return queryset.filter(payment_for_years__contains=[value])

    class Meta:
        model = Payment
        fields = ["country_id", "year"]
