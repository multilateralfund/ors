from rest_framework import viewsets, mixins, views
from rest_framework.response import Response

from core.api.filters.replenishments import ContributionFilter
from core.api.serializers import (
    CountrySerializer,
    ReplenishmentSerializer,
    ContributionSerializer,
)
from core.models import Country, Replenishment, Contribution


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

    model = Contribution
    filterset_class = ContributionFilter
    serializer_class = ContributionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.user_type == user.UserType.SECRETARIAT:
            return Contribution.objects.select_related(
                "country", "replenishment"
            ).order_by("country__name")
        return Contribution.objects.none()


class StatusOfContributionsView(views.APIView):
    def get(self, request, *args, **kwargs):
        user = request.user

        # TODO: response changes based on params, not only filters :(
        mock_data = {
            "disputed_contributions": 10000,
            "total": {
                "agreed_contributions": 4000000,
                "agreed_contributions_with_disputed": 4010000,
                "cash_payments": 3100000,
                "bilateral_assisstance": 200000,
                "promissory_notes": 200000,
                "outstanding_contributions": 500000,
                "outstanding_contributions_with_disputed": 510000,
                "gain_loss": 100000,
            },
            "status_of_contributions": [
                {
                    "id": 1,
                    "country": {
                        "id": 421,
                        "name": "Andorra",
                        "abbr": "AD",
                        "name_alt": "Andorra",
                        "iso3": "AND",
                        "has_cp_report": None,
                        "is_a2": False,
                    },
                    "agreed_contributions": 1000000,
                    "cash_payments": 1000000,
                    "bilateral_assisstance": 0,
                    "promissory_notes": 0,
                    "outstanding_contributions": 0,
                    "gain_loss": 50000,
                },
                {
                    "id": 2,
                    "country": {
                        "id": 426,
                        "name": "Australia",
                        "abbr": "AU",
                        "name_alt": "Australia",
                        "iso3": "AUS",
                        "has_cp_report": None,
                        "is_a2": False,
                    },
                    "agreed_contributions": 1000000,
                    "cash_payments": 1000000,
                    "bilateral_assisstance": 0,
                    "promissory_notes": 0,
                    "outstanding_contributions": 0,
                    "gain_loss": 50000,
                },
                {
                    "id": 3,
                    "country": {
                        "id": 427,
                        "name": "Austria",
                        "abbr": "AT",
                        "name_alt": "Austria",
                        "iso3": "AUT",
                        "has_cp_report": None,
                        "is_a2": False,
                    },
                    "agreed_contributions": 1000000,
                    "cash_payments": 500000,
                    "bilateral_assisstance": 200000,
                    "promissory_notes": 0,
                    "outstanding_contributions": 300000,
                    "gain_loss": 20000,
                },
                {
                    "id": 4,
                    "country": {
                        "id": 428,
                        "name": "Azerbaijan",
                        "abbr": "AZ",
                        "name_alt": "Azerbaijan",
                        "iso3": "AZE",
                        "has_cp_report": None,
                        "is_a2": False,
                    },
                    "agreed_contributions": 1000000,
                    "cash_payments": 600000,
                    "bilateral_assisstance": 0,
                    "promissory_notes": 200000,
                    "outstanding_contributions": 200000,
                    "gain_loss": -20000,
                },
            ],
        }

        if user.user_type == user.UserType.SECRETARIAT:
            return Response(mock_data)

        return Response({})
