from django.db import models
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
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


class ContributionViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
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


class StatusOfContributionsView(views.APIView):

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "start_year",
                openapi.IN_QUERY,
                description="Start year for the status of contributions",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "end_year",
                openapi.IN_QUERY,
                description="End year for the status of contributions",
                type=openapi.TYPE_INTEGER,
            ),
        ]
    )
    def get(self, request, *args, **kwargs):
        user = request.user

        if user.user_type != user.UserType.SECRETARIAT:
            return Response({})

        data = {}
        disputed_contributions_qs = DisputedContribution.objects.all()
        contribution_status_qs = AnnualContributionStatus.objects.all()
        country_filter = models.Q(annual_contributions_status__isnull=False)

        if request.query_params.get("start_year"):
            disputed_contributions_qs = disputed_contributions_qs.filter(
                year__gte=request.query_params["start_year"]
            )
            contribution_status_qs = contribution_status_qs.filter(
                year__gte=request.query_params["start_year"]
            )
            country_filter &= models.Q(
                annual_contributions_status__year__gte=request.query_params["start_year"]
            )

        if request.query_params.get("end_year"):
            disputed_contributions_qs = disputed_contributions_qs.filter(
                year__lte=request.query_params["end_year"]
            )
            contribution_status_qs = contribution_status_qs.filter(
                year__lte=request.query_params["end_year"]
            )
            country_filter &= models.Q(
                annual_contributions_status__year__lte=request.query_params["end_year"]
            )

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
            for country in Country.objects.filter(country_filter)
            .prefetch_related("annual_contributions_status")
            .select_related("ferm_gain_loss")
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
                gain_loss=models.F("ferm_gain_loss__amount"),
            )
            .order_by("country__name")
        ]

        disputed_contributions_total = disputed_contributions_qs.aggregate(
            total=models.Sum("amount", default=0)
        )["total"]
        data["total"] = contribution_status_qs.aggregate(
            agreed_contributions=models.Sum("agreed_contributions", default=0),
            cash_payments=models.Sum("cash_payments", default=0),
            bilateral_assistance=models.Sum("bilateral_assistance", default=0),
            promissory_notes=models.Sum("promissory_notes", default=0),
            outstanding_contributions=models.Sum(
                "outstanding_contributions", default=0
            ),
        )

        data["total"]["agreed_contributions_with_disputed"] = (
            data["total"]["agreed_contributions"] + disputed_contributions_total
        )
        data["total"]["outstanding_contributions_with_disputed"] = (
            data["total"]["outstanding_contributions"] + disputed_contributions_total
        )
        data["disputed_contributions"] = disputed_contributions_total

        return Response(data)
