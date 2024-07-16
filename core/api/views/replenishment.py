from decimal import Decimal

from django.db import models
from rest_framework import viewsets, mixins, views
from rest_framework.response import Response

from core.api.filters.replenishments import ScaleOfAssessmentFilter
from core.api.serializers import (
    CountrySerializer,
    ReplenishmentSerializer,
    ScaleOfAssessmentSerializer,
)
from core.models import (
    Country,
    Replenishment,
    ScaleOfAssessment,
    AnnualContributionStatus,
    DisputedContribution,
    TriennialContributionStatus,
    FermGainLoss,
    ExternalIncome,
    ExternalAllocation,
)


class ReplenishmentCountriesViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    """
    Viewset for all the countries that are available for a replenishment.
    """

    serializer_class = CountrySerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Country.objects.all()
        if user.user_type == user.UserType.COUNTRY_USER:
            queryset = queryset.filter(id=user.country_id)
        return queryset.order_by("name")


class ReplenishmentViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    """
    Viewset for all replenishments that are available.
    """

    model = Replenishment
    serializer_class = ReplenishmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.user_type == user.UserType.SECRETARIAT:
            return Replenishment.objects.order_by("-start_year")
        return Replenishment.objects.none()


class ScaleOfAssessmentViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    """
    Viewset for all contributions that are available.
    """

    model = ScaleOfAssessment
    filterset_class = ScaleOfAssessmentFilter
    serializer_class = ScaleOfAssessmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.user_type == user.UserType.SECRETARIAT:
            return ScaleOfAssessment.objects.select_related(
                "country", "replenishment"
            ).order_by("country__name")
        return ScaleOfAssessment.objects.none()


class AnnualStatusOfContributionsView(views.APIView):

    def get(self, request, *args, **kwargs):
        year = kwargs["year"]
        user = request.user

        if user.user_type != user.UserType.SECRETARIAT:
            return Response({})

        data = {}
        data["status_of_contributions"] = [
            {
                "country": CountrySerializer(country).data,
                "agreed_contributions": country.agreed_contributions,
                "cash_payments": country.cash_payments,
                "bilateral_assistance": country.bilateral_assistance,
                "promissory_notes": country.promissory_notes,
                "outstanding_contributions": country.outstanding_contributions,
            }
            for country in Country.objects.filter(
                annual_contributions_status__year=year,
            )
            .prefetch_related("annual_contributions_status")
            .annotate(
                agreed_contributions=models.Sum(
                    "annual_contributions_status__agreed_contributions", default=0
                ),
                cash_payments=models.Sum(
                    "annual_contributions_status__cash_payments", default=0
                ),
                bilateral_assistance=models.Sum(
                    "annual_contributions_status__bilateral_assistance", default=0
                ),
                promissory_notes=models.Sum(
                    "annual_contributions_status__promissory_notes", default=0
                ),
                outstanding_contributions=models.Sum(
                    "annual_contributions_status__outstanding_contributions", default=0
                ),
            )
            .order_by("name")
        ]

        data["total"] = AnnualContributionStatus.objects.filter(year=year).aggregate(
            agreed_contributions=models.Sum("agreed_contributions", default=0),
            cash_payments=models.Sum("cash_payments", default=0),
            bilateral_assistance=models.Sum("bilateral_assistance", default=0),
            promissory_notes=models.Sum("promissory_notes", default=0),
            outstanding_contributions=models.Sum(
                "outstanding_contributions", default=0
            ),
        )

        try:
            disputed_contribution_amount = DisputedContribution.objects.get(
                year=year
            ).amount
        except DisputedContribution.DoesNotExist:
            disputed_contribution_amount = 0

        data["total"]["agreed_contributions_with_disputed"] = (
            data["total"]["agreed_contributions"] + disputed_contribution_amount
        )
        data["total"]["outstanding_contributions_with_disputed"] = (
            data["total"]["outstanding_contributions"] + disputed_contribution_amount
        )
        data["disputed_contributions"] = disputed_contribution_amount

        return Response(data)


class TriennialStatusOfContributionsView(views.APIView):

    def get(self, request, *args, **kwargs):
        start_year = kwargs["start_year"]
        end_year = kwargs["end_year"]
        user = request.user

        if user.user_type != user.UserType.SECRETARIAT:
            return Response({})

        data = {}
        data["status_of_contributions"] = [
            {
                "country": CountrySerializer(country).data,
                "agreed_contributions": country.agreed_contributions,
                "cash_payments": country.cash_payments,
                "bilateral_assistance": country.bilateral_assistance,
                "promissory_notes": country.promissory_notes,
                "outstanding_contributions": country.outstanding_contributions,
            }
            for country in Country.objects.filter(
                triennial_contributions_status__start_year=start_year,
                triennial_contributions_status__end_year=end_year,
            )
            .prefetch_related("triennial_contributions_status")
            .annotate(
                agreed_contributions=models.Sum(
                    "triennial_contributions_status__agreed_contributions", default=0
                ),
                cash_payments=models.Sum(
                    "triennial_contributions_status__cash_payments", default=0
                ),
                bilateral_assistance=models.Sum(
                    "triennial_contributions_status__bilateral_assistance", default=0
                ),
                promissory_notes=models.Sum(
                    "triennial_contributions_status__promissory_notes", default=0
                ),
                outstanding_contributions=models.Sum(
                    "triennial_contributions_status__outstanding_contributions",
                    default=0,
                ),
            )
            .order_by("name")
        ]

        data["total"] = TriennialContributionStatus.objects.filter(
            start_year=start_year, end_year=end_year
        ).aggregate(
            agreed_contributions=models.Sum("agreed_contributions", default=0),
            cash_payments=models.Sum("cash_payments", default=0),
            bilateral_assistance=models.Sum("bilateral_assistance", default=0),
            promissory_notes=models.Sum("promissory_notes", default=0),
            outstanding_contributions=models.Sum(
                "outstanding_contributions", default=0
            ),
        )

        disputed_contribution_amount = DisputedContribution.objects.filter(
            year__gte=start_year, year__lte=end_year
        ).aggregate(total=models.Sum("amount", default=0))["total"]
        data["total"]["agreed_contributions_with_disputed"] = (
            data["total"]["agreed_contributions"] + disputed_contribution_amount
        )
        data["total"]["outstanding_contributions_with_disputed"] = (
            data["total"]["outstanding_contributions"] + disputed_contribution_amount
        )
        data["disputed_contributions"] = disputed_contribution_amount

        return Response(data)


class SummaryStatusOfContributionsView(views.APIView):

    def get(self, request, *args, **kwargs):
        user = request.user

        if user.user_type != user.UserType.SECRETARIAT:
            return Response({})

        data = {}
        data["status_of_contributions"] = [
            {
                "country": CountrySerializer(country).data,
                "agreed_contributions": country.agreed_contributions,
                "cash_payments": country.cash_payments,
                "bilateral_assistance": country.bilateral_assistance,
                "promissory_notes": country.promissory_notes,
                "outstanding_contributions": country.outstanding_contributions,
                "gain_loss": country.gain_loss,
            }
            for country in Country.objects.filter(
                triennial_contributions_status__isnull=False
            )
            .prefetch_related("triennial_contributions_status")
            .select_related("ferm_gain_loss")
            .annotate(
                agreed_contributions=models.Sum(
                    "triennial_contributions_status__agreed_contributions", default=0
                ),
                cash_payments=models.Sum(
                    "triennial_contributions_status__cash_payments", default=0
                ),
                bilateral_assistance=models.Sum(
                    "triennial_contributions_status__bilateral_assistance", default=0
                ),
                promissory_notes=models.Sum(
                    "triennial_contributions_status__promissory_notes", default=0
                ),
                outstanding_contributions=models.Sum(
                    "triennial_contributions_status__outstanding_contributions",
                    default=0,
                ),
                gain_loss=models.F("ferm_gain_loss__amount"),
            )
            .order_by("name")
        ]

        data["total"] = TriennialContributionStatus.objects.aggregate(
            agreed_contributions=models.Sum("agreed_contributions", default=0),
            cash_payments=models.Sum("cash_payments", default=0),
            bilateral_assistance=models.Sum("bilateral_assistance", default=0),
            promissory_notes=models.Sum("promissory_notes", default=0),
            outstanding_contributions=models.Sum(
                "outstanding_contributions", default=0
            ),
        )
        data["total"]["gain_loss"] = FermGainLoss.objects.aggregate(
            total=models.Sum("amount", default=0)
        )["total"]

        disputed_contribution_amount = DisputedContribution.objects.filter().aggregate(
            total=models.Sum("amount", default=0)
        )["total"]
        data["total"]["agreed_contributions_with_disputed"] = (
            data["total"]["agreed_contributions"] + disputed_contribution_amount
        )
        data["total"]["outstanding_contributions_with_disputed"] = (
            data["total"]["outstanding_contributions"] + disputed_contribution_amount
        )
        data["disputed_contributions"] = disputed_contribution_amount

        return Response(data)


class ReplenishmentDashboardView(views.APIView):

    def get(self, request, *args, **kwargs):
        user = request.user

        if user.user_type != user.UserType.SECRETARIAT:
            return Response({})

        income = ExternalIncome.objects.get()
        allocations = ExternalAllocation.objects.get()

        computed_data = TriennialContributionStatus.objects.aggregate(
            agreed_contributions=models.Sum("agreed_contributions", default=0),
            cash_payments=models.Sum("cash_payments", default=0),
            bilateral_assistance=models.Sum("bilateral_assistance", default=0),
            promissory_notes=models.Sum("promissory_notes", default=0),
        )

        gain_loss = FermGainLoss.objects.aggregate(
            total=models.Sum("amount", default=0)
        )["total"]

        payment_pledge_percentage = (
            (
                computed_data["cash_payments"]
                + computed_data["bilateral_assistance"]
                + computed_data["promissory_notes"]
            )
            / computed_data["agreed_contributions"]
            * Decimal("100")
        )

        data = {
            "overview": {
                "payment_pledge_percentage": payment_pledge_percentage,
                "gain_loss": gain_loss,
            },
            "income": {
                "cash_payments": computed_data["cash_payments"],
                "bilateral_assistance": computed_data["bilateral_assistance"],
                "interest_earned": income.interest_earned,
                "promissory_notes": computed_data["promissory_notes"],
                "miscellaneous_income": income.miscellaneous_income,
            },
            "allocations": {
                "undp": allocations.undp,
                "unep": allocations.unep,
                "unido": allocations.unido,
                "world_bank": allocations.world_bank,
                "staff_contracts": allocations.staff_contracts,
                "treasury_fees": allocations.treasury_fees,
                "monitoring_fees": allocations.monitoring_fees,
                "technical_audit": allocations.technical_audit,
                "information_strategy": allocations.information_strategy,
                "bilateral_assistance": computed_data["bilateral_assistance"],
                "gain_loss": gain_loss,
            },
        }

        data["overview"]["balance"] = sum(data["income"].values()) - sum(
            data["allocations"].values()
        )

        return Response(data)
