import decimal

import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    CountryFactory,
    ReplenishmentFactory,
    ScaleOfAssessmentFactory,
    AnnualContributionStatusFactory,
    DisputedContributionsFactory,
    FermGainLossFactory,
)


pytestmark = pytest.mark.django_db


class TestReplenishmentCountries(BaseTest):
    url = reverse("replenishment-countries-list")

    def test_replenishment_countries_list(self, user):
        CountryFactory.create(name="Country 1", iso3="XYZ")
        CountryFactory.create(name="Country 2", iso3="ABC")

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["name"] == "Country 1"
        assert response.data[0]["iso3"] == "XYZ"
        assert response.data[1]["name"] == "Country 2"
        assert response.data[1]["iso3"] == "ABC"

    def test_replenishment_countries_list_country_user(self, country_user):
        CountryFactory.create(name="Country 2", iso3="ABC")

        self.client.force_authenticate(user=country_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["name"] == country_user.country.name
        assert response.data[0]["iso3"] == country_user.country.iso3


class TestReplenishments(BaseTest):
    url = reverse("replenishment-replenishments-list")

    def test_replenishments_list(self, user):
        replenishment_1 = ReplenishmentFactory.create(start_year=2018, end_year=2020)
        replenishment_2 = ReplenishmentFactory.create(start_year=2021, end_year=2023)

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2

        assert response.data[0]["start_year"] == 2021
        assert response.data[0]["id"] == replenishment_2.id
        assert response.data[0]["end_year"] == 2023
        assert response.data[1]["start_year"] == 2018
        assert response.data[1]["id"] == replenishment_1.id
        assert response.data[1]["end_year"] == 2020

    def test_replenishments_list_country_user(self, country_user):
        ReplenishmentFactory.create(start_year=2018, end_year=2020)
        ReplenishmentFactory.create(start_year=2021, end_year=2023)

        self.client.force_authenticate(user=country_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 0


class TestScalesOfAssessment(BaseTest):
    url = reverse("replenishment-scales-of-assessment")

    def test_scales_of_assessment_list(self, user):
        replenishment_1 = ReplenishmentFactory.create(start_year=2018, end_year=2020)
        replenishment_2 = ReplenishmentFactory.create(start_year=2021, end_year=2023)
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")
        contribution_1 = ScaleOfAssessmentFactory.create(
            country=country_1, replenishment=replenishment_1
        )
        contribution_2 = ScaleOfAssessmentFactory.create(
            country=country_2, replenishment=replenishment_2
        )

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2

        assert response.data[0]["country"]["name"] == "Country 1"
        assert response.data[0]["country"]["iso3"] == "XYZ"
        assert (
            response.data[0]["adjusted_scale_of_assessment"]
            == contribution_1.override_adjusted_scale_of_assessment
        )

        assert response.data[1]["country"]["name"] == "Country 2"
        assert response.data[1]["country"]["iso3"] == "ABC"
        assert (
            response.data[1]["adjusted_scale_of_assessment"]
            == contribution_2.override_adjusted_scale_of_assessment
        )

    def test_scales_of_assessment_list_filtered(self, user):
        replenishment_1 = ReplenishmentFactory.create(start_year=2018, end_year=2020)
        replenishment_2 = ReplenishmentFactory.create(start_year=2021, end_year=2023)
        contribution_1 = ScaleOfAssessmentFactory.create(replenishment=replenishment_1)
        ScaleOfAssessmentFactory.create(replenishment=replenishment_2)

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"start_year": replenishment_1.start_year})
        assert response.status_code == 200
        assert len(response.data) == 1

        assert response.data[0]["country"]["name"] == contribution_1.country.name
        assert (
            response.data[0]["replenishment"]["start_year"]
            == replenishment_1.start_year
        )

    def test_scales_of_assessment_list_country_user(self, country_user):
        replenishment_1 = ReplenishmentFactory.create(start_year=2018, end_year=2020)
        replenishment_2 = ReplenishmentFactory.create(start_year=2021, end_year=2023)
        ScaleOfAssessmentFactory.create(replenishment=replenishment_1)
        ScaleOfAssessmentFactory.create(replenishment=replenishment_2)

        self.client.force_authenticate(user=country_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 0


class TestStatusOfContributions(BaseTest):
    url = reverse("replenishment-status-of-contributions")
    fifteen_decimals = decimal.Decimal("0.000000000000001")

    def test_status_of_contributions(self, user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")
        year_1 = 2020
        year_2 = 2021

        contribution_1 = AnnualContributionStatusFactory.create(
            country=country_1, year=year_1
        )
        contribution_2 = AnnualContributionStatusFactory.create(
            country=country_1, year=year_2
        )
        contribution_3 = AnnualContributionStatusFactory.create(
            country=country_2, year=year_1
        )
        contribution_4 = AnnualContributionStatusFactory.create(
            country=country_2, year=year_2
        )

        disputed_1 = DisputedContributionsFactory.create(year=year_1)
        disputed_2 = DisputedContributionsFactory.create(year=year_2)

        ferm_gain_loss_1 = FermGainLossFactory.create(country=country_1)
        ferm_gain_loss_2 = FermGainLossFactory.create(country=country_2)

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        response_data = response.data

        # To list, so it's not a queryset
        response_data["status_of_contributions"] = list(
            response_data["status_of_contributions"]
        )

        assert response.data == {
            "status_of_contributions": [
                {
                    "country": {
                        "id": country_1.id,
                        "name": country_1.name,
                        "abbr": country_1.abbr,
                        "name_alt": country_1.name_alt,
                        "iso3": country_1.iso3,
                        "has_cp_report": None,
                        "is_a2": country_1.is_a2,
                    },
                    "agreed_contributions": (
                        contribution_1.agreed_contributions
                        + contribution_2.agreed_contributions
                    ).quantize(self.fifteen_decimals),
                    "cash_payments": (
                        contribution_1.cash_payments + contribution_2.cash_payments
                    ).quantize(self.fifteen_decimals),
                    "bilateral_assistance": (
                        contribution_1.bilateral_assistance
                        + contribution_2.bilateral_assistance
                    ).quantize(self.fifteen_decimals),
                    "promissory_notes": (
                        contribution_1.promissory_notes
                        + contribution_2.promissory_notes
                    ).quantize(self.fifteen_decimals),
                    "outstanding_contributions": (
                        contribution_1.outstanding_contributions
                        + contribution_2.outstanding_contributions
                    ).quantize(self.fifteen_decimals),
                    "gain_loss": ferm_gain_loss_1.amount.quantize(
                        self.fifteen_decimals
                    ),
                },
                {
                    "country": {
                        "id": country_2.id,
                        "name": country_2.name,
                        "abbr": country_2.abbr,
                        "name_alt": country_2.name_alt,
                        "iso3": country_2.iso3,
                        "has_cp_report": None,
                        "is_a2": country_2.is_a2,
                    },
                    "agreed_contributions": (
                        contribution_3.agreed_contributions
                        + contribution_4.agreed_contributions
                    ).quantize(self.fifteen_decimals),
                    "cash_payments": (
                        contribution_3.cash_payments + contribution_4.cash_payments
                    ).quantize(self.fifteen_decimals),
                    "bilateral_assistance": (
                        contribution_3.bilateral_assistance
                        + contribution_4.bilateral_assistance
                    ).quantize(self.fifteen_decimals),
                    "promissory_notes": (
                        contribution_3.promissory_notes
                        + contribution_4.promissory_notes
                    ).quantize(self.fifteen_decimals),
                    "outstanding_contributions": (
                        contribution_3.outstanding_contributions
                        + contribution_4.outstanding_contributions
                    ).quantize(self.fifteen_decimals),
                    "gain_loss": ferm_gain_loss_2.amount.quantize(
                        self.fifteen_decimals
                    ),
                },
            ],
            "total": {
                "agreed_contributions": (
                    contribution_1.agreed_contributions
                    + contribution_2.agreed_contributions
                    + contribution_3.agreed_contributions
                    + contribution_4.agreed_contributions
                ).quantize(self.fifteen_decimals),
                "cash_payments": (
                    contribution_1.cash_payments
                    + contribution_2.cash_payments
                    + contribution_3.cash_payments
                    + contribution_4.cash_payments
                ).quantize(self.fifteen_decimals),
                "bilateral_assistance": (
                    contribution_1.bilateral_assistance
                    + contribution_2.bilateral_assistance
                    + contribution_3.bilateral_assistance
                    + contribution_4.bilateral_assistance
                ).quantize(self.fifteen_decimals),
                "promissory_notes": (
                    contribution_1.promissory_notes
                    + contribution_2.promissory_notes
                    + contribution_3.promissory_notes
                    + contribution_4.promissory_notes
                ).quantize(self.fifteen_decimals),
                "outstanding_contributions": (
                    contribution_1.outstanding_contributions
                    + contribution_2.outstanding_contributions
                    + contribution_3.outstanding_contributions
                    + contribution_4.outstanding_contributions
                ).quantize(self.fifteen_decimals),
                "agreed_contributions_with_disputed": (
                    contribution_1.agreed_contributions
                    + contribution_2.agreed_contributions
                    + contribution_3.agreed_contributions
                    + contribution_4.agreed_contributions
                    + disputed_1.amount
                    + disputed_2.amount
                ).quantize(self.fifteen_decimals),
                "outstanding_contributions_with_disputed": (
                    contribution_1.outstanding_contributions
                    + contribution_2.outstanding_contributions
                    + contribution_3.outstanding_contributions
                    + contribution_4.outstanding_contributions
                    + disputed_1.amount
                    + disputed_2.amount
                ).quantize(self.fifteen_decimals),
            },
            "disputed_contributions": (disputed_1.amount + disputed_2.amount).quantize(
                self.fifteen_decimals
            ),
        }

    def test_status_of_contributions_year_filters(self, user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")
        year_1 = 2020
        year_2 = 2021

        contribution_1 = AnnualContributionStatusFactory.create(
            country=country_1, year=year_1
        )
        AnnualContributionStatusFactory.create(country=country_1, year=year_2)
        contribution_3 = AnnualContributionStatusFactory.create(
            country=country_2, year=year_1
        )
        AnnualContributionStatusFactory.create(country=country_2, year=year_2)

        disputed_1 = DisputedContributionsFactory.create(year=year_1)
        DisputedContributionsFactory.create(year=year_2)

        ferm_gain_loss_1 = FermGainLossFactory.create(country=country_1)
        ferm_gain_loss_2 = FermGainLossFactory.create(country=country_2)

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"start_year": year_1, "end_year": year_1})

        response_data = response.data

        # To list, so it's not a queryset
        response_data["status_of_contributions"] = list(
            response_data["status_of_contributions"]
        )

        assert response.data == {
            "status_of_contributions": [
                {
                    "country": {
                        "id": country_1.id,
                        "name": country_1.name,
                        "abbr": country_1.abbr,
                        "name_alt": country_1.name_alt,
                        "iso3": country_1.iso3,
                        "has_cp_report": None,
                        "is_a2": country_1.is_a2,
                    },
                    "agreed_contributions": contribution_1.agreed_contributions.quantize(
                        self.fifteen_decimals
                    ),
                    "cash_payments": contribution_1.cash_payments.quantize(
                        self.fifteen_decimals
                    ),
                    "bilateral_assistance": contribution_1.bilateral_assistance.quantize(
                        self.fifteen_decimals
                    ),
                    "promissory_notes": contribution_1.promissory_notes.quantize(
                        self.fifteen_decimals
                    ),
                    "outstanding_contributions": contribution_1.outstanding_contributions.quantize(
                        self.fifteen_decimals
                    ),
                    "gain_loss": ferm_gain_loss_1.amount.quantize(
                        self.fifteen_decimals
                    ),
                },
                {
                    "country": {
                        "id": country_2.id,
                        "name": country_2.name,
                        "abbr": country_2.abbr,
                        "name_alt": country_2.name_alt,
                        "iso3": country_2.iso3,
                        "has_cp_report": None,
                        "is_a2": country_2.is_a2,
                    },
                    "agreed_contributions": contribution_3.agreed_contributions.quantize(
                        self.fifteen_decimals
                    ),
                    "cash_payments": contribution_3.cash_payments.quantize(
                        self.fifteen_decimals
                    ),
                    "bilateral_assistance": contribution_3.bilateral_assistance.quantize(
                        self.fifteen_decimals
                    ),
                    "promissory_notes": contribution_3.promissory_notes.quantize(
                        self.fifteen_decimals
                    ),
                    "outstanding_contributions": contribution_3.outstanding_contributions.quantize(
                        self.fifteen_decimals
                    ),
                    "gain_loss": ferm_gain_loss_2.amount.quantize(
                        self.fifteen_decimals
                    ),
                },
            ],
            "total": {
                "agreed_contributions": (
                    contribution_1.agreed_contributions
                    + contribution_3.agreed_contributions
                ).quantize(self.fifteen_decimals),
                "cash_payments": (
                    contribution_1.cash_payments + contribution_3.cash_payments
                ).quantize(self.fifteen_decimals),
                "bilateral_assistance": (
                    contribution_1.bilateral_assistance
                    + contribution_3.bilateral_assistance
                ).quantize(self.fifteen_decimals),
                "promissory_notes": (
                    contribution_1.promissory_notes + contribution_3.promissory_notes
                ).quantize(self.fifteen_decimals),
                "outstanding_contributions": (
                    contribution_1.outstanding_contributions
                    + contribution_3.outstanding_contributions
                ).quantize(self.fifteen_decimals),
                "agreed_contributions_with_disputed": (
                    contribution_1.agreed_contributions
                    + contribution_3.agreed_contributions
                    + disputed_1.amount
                ).quantize(self.fifteen_decimals),
                "outstanding_contributions_with_disputed": (
                    contribution_1.outstanding_contributions
                    + contribution_3.outstanding_contributions
                    + disputed_1.amount
                ).quantize(self.fifteen_decimals),
            },
            "disputed_contributions": disputed_1.amount.quantize(self.fifteen_decimals),
        }

    def test_status_of_contributions_country_user(self, country_user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")
        year_1 = 2020
        year_2 = 2021

        AnnualContributionStatusFactory.create(country=country_1, year=year_1)
        AnnualContributionStatusFactory.create(country=country_1, year=year_2)
        AnnualContributionStatusFactory.create(country=country_2, year=year_1)
        AnnualContributionStatusFactory.create(country=country_2, year=year_2)

        DisputedContributionsFactory.create(year=year_1)
        DisputedContributionsFactory.create(year=year_2)

        FermGainLossFactory.create(country=country_1)
        FermGainLossFactory.create(country=country_2)

        self.client.force_authenticate(user=country_user)

        response = self.client.get(self.url)
        assert response.data == {}
