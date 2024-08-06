# TODO: split the file into multiple files
# pylint: disable=C0302

import decimal
from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    CountryFactory,
    ReplenishmentFactory,
    ScaleOfAssessmentFactory,
    AnnualContributionStatusFactory,
    DisputedContributionsFactory,
    FermGainLossFactory,
    InvoiceFactory,
    PaymentFactory,
    TriennialContributionStatusFactory,
    ScaleOfAssessmentVersionFactory,
)
from core.models import (
    ExternalIncome,
    ExternalAllocation,
    ScaleOfAssessment,
    ScaleOfAssessmentVersion,
    Replenishment,
    Country,
    DisputedContribution,
)


pytestmark = pytest.mark.django_db
# pylint: disable=C0302


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
    url = reverse("replenishment-scales-of-assessment-list")

    def test_scales_of_assessment_list(self, user):
        replenishment_1 = ReplenishmentFactory.create(start_year=2018, end_year=2020)
        replenishment_2 = ReplenishmentFactory.create(start_year=2021, end_year=2023)
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")
        version_1 = ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment_1, version=0
        )
        version_2 = ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment_2, version=0
        )
        soa_1 = ScaleOfAssessmentFactory.create(country=country_1, version=version_1)
        soa_2 = ScaleOfAssessmentFactory.create(country=country_2, version=version_2)

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2

        assert response.data[0]["country"]["name"] == "Country 1"
        assert response.data[0]["country"]["iso3"] == "XYZ"
        assert (
            response.data[0]["adjusted_scale_of_assessment"]
            == soa_1.override_adjusted_scale_of_assessment
        )

        assert response.data[1]["country"]["name"] == "Country 2"
        assert response.data[1]["country"]["iso3"] == "ABC"
        assert (
            response.data[1]["adjusted_scale_of_assessment"]
            == soa_2.override_adjusted_scale_of_assessment
        )

    def test_scales_of_assessment_list_filtered(self, user):
        replenishment_1 = ReplenishmentFactory.create(start_year=2018, end_year=2020)
        replenishment_2 = ReplenishmentFactory.create(start_year=2021, end_year=2023)
        version_1 = ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment_1, version=0
        )
        version_2 = ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment_2, version=0
        )
        soa_1 = ScaleOfAssessmentFactory.create(version=version_1)
        ScaleOfAssessmentFactory.create(version=version_2)

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"start_year": replenishment_1.start_year})
        assert response.status_code == 200
        assert len(response.data) == 1

        assert response.data[0]["country"]["name"] == soa_1.country.name
        assert (
            response.data[0]["replenishment"]["start_year"]
            == replenishment_1.start_year
        )

    def test_scales_of_assessment_list_country_user(self, country_user):
        replenishment_1 = ReplenishmentFactory.create(start_year=2018, end_year=2020)
        replenishment_2 = ReplenishmentFactory.create(start_year=2021, end_year=2023)
        version_1 = ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment_1, version=0
        )
        version_2 = ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment_2, version=0
        )
        ScaleOfAssessmentFactory.create(version=version_1)
        ScaleOfAssessmentFactory.create(version=version_2)

        self.client.force_authenticate(user=country_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 0


class TestStatusOfContributions:
    client = APIClient()
    fifteen_decimals = decimal.Decimal("0.000000000000001")

    def test_annual_status_of_contributions(self, user):
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

        disputed_1 = DisputedContributionsFactory.create(year=year_1, country=country_1)
        disputed_2 = DisputedContributionsFactory.create(year=year_2, country=None)

        assert disputed_2.country is None

        FermGainLossFactory.create(country=country_1)
        FermGainLossFactory.create(country=country_2)

        self.client.force_authenticate(user=user)

        response = self.client.get(
            reverse(
                "replenishment-status-of-contributions-annual",
                kwargs={
                    "year": year_1,
                },
            )
        )

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
                    ).quantize(self.fifteen_decimals),
                    "cash_payments": contribution_1.cash_payments.quantize(
                        self.fifteen_decimals
                    ),
                    "bilateral_assistance": (
                        contribution_1.bilateral_assistance
                    ).quantize(self.fifteen_decimals),
                    "promissory_notes": contribution_1.promissory_notes.quantize(
                        self.fifteen_decimals
                    ),
                    "outstanding_contributions": (
                        contribution_1.outstanding_contributions
                    ).quantize(self.fifteen_decimals),
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
                    ).quantize(self.fifteen_decimals),
                    "cash_payments": contribution_3.cash_payments.quantize(
                        self.fifteen_decimals
                    ),
                    "bilateral_assistance": (
                        contribution_3.bilateral_assistance
                    ).quantize(self.fifteen_decimals),
                    "promissory_notes": contribution_3.promissory_notes.quantize(
                        self.fifteen_decimals
                    ),
                    "outstanding_contributions": (
                        contribution_3.outstanding_contributions
                    ).quantize(self.fifteen_decimals),
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
            "disputed_contributions_per_country": [
                {
                    "id": disputed_1.id,
                    "country": {
                        "id": country_1.id,
                        "name": country_1.name,
                        "abbr": country_1.abbr,
                        "name_alt": country_1.name_alt,
                        "iso3": country_1.iso3,
                        "has_cp_report": None,
                        "is_a2": country_1.is_a2,
                    },
                    "year": year_1,
                    "amount": disputed_1.amount.quantize(self.fifteen_decimals),
                    "comment": disputed_1.comment,
                }
            ],
        }

    def test_triennial_status_of_contributions(self, user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")
        year_1 = 2020
        year_2 = 2022
        year_3 = 2023
        year_4 = 2025

        contribution_1 = TriennialContributionStatusFactory.create(
            country=country_1, start_year=year_1, end_year=year_2
        )
        TriennialContributionStatusFactory.create(
            country=country_1, start_year=year_3, end_year=year_4
        )
        contribution_3 = TriennialContributionStatusFactory.create(
            country=country_2, start_year=year_1, end_year=year_2
        )
        TriennialContributionStatusFactory.create(
            country=country_2, start_year=year_3, end_year=year_4
        )

        disputed_1 = DisputedContributionsFactory.create(year=year_1, country=None)
        DisputedContributionsFactory.create(year=year_3, country=None)

        self.client.force_authenticate(user=user)

        response = self.client.get(
            reverse(
                "replenishment-status-of-contributions-triennial",
                kwargs={
                    "start_year": year_1,
                    "end_year": year_2,
                },
            )
        )

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
            "disputed_contributions_per_country": [],
        }

    def test_summary_status_of_contributions(self, user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")
        year_1 = 2020
        year_2 = 2022
        year_3 = 2023
        year_4 = 2025

        contribution_1 = TriennialContributionStatusFactory.create(
            country=country_1, start_year=year_1, end_year=year_2
        )
        contribution_2 = TriennialContributionStatusFactory.create(
            country=country_1, start_year=year_3, end_year=year_4
        )
        contribution_3 = TriennialContributionStatusFactory.create(
            country=country_2, start_year=year_1, end_year=year_2
        )
        contribution_4 = TriennialContributionStatusFactory.create(
            country=country_2, start_year=year_3, end_year=year_4
        )

        disputed_1 = DisputedContributionsFactory.create(year=year_1, country=country_1)
        disputed_2 = DisputedContributionsFactory.create(year=year_3, country=None)

        ferm_gain_loss_1 = FermGainLossFactory.create(country=country_1)
        ferm_gain_loss_2 = FermGainLossFactory.create(country=country_2)

        self.client.force_authenticate(user=user)

        response = self.client.get(
            reverse(
                "replenishment-status-of-contributions-summary",
            )
        )

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
                "gain_loss": (
                    ferm_gain_loss_1.amount + ferm_gain_loss_2.amount
                ).quantize(self.fifteen_decimals),
            },
            "disputed_contributions": (disputed_1.amount + disputed_2.amount).quantize(
                self.fifteen_decimals
            ),
            "disputed_contributions_per_country": [
                {
                    "id": disputed_1.id,
                    "country": {
                        "id": country_1.id,
                        "name": country_1.name,
                        "abbr": country_1.abbr,
                        "name_alt": country_1.name_alt,
                        "iso3": country_1.iso3,
                        "has_cp_report": None,
                        "is_a2": country_1.is_a2,
                    },
                    "year": year_1,
                    "amount": disputed_1.amount.quantize(self.fifteen_decimals),
                    "comment": disputed_1.comment,
                }
            ],
        }

    def test_without_login(self):
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

        self.client.force_authenticate(user=None)

        response = self.client.get(
            reverse(
                "replenishment-status-of-contributions-annual",
                kwargs={
                    "year": year_1,
                },
            )
        )
        assert response.status_code == 403

        response = self.client.get(
            reverse(
                "replenishment-status-of-contributions-triennial",
                kwargs={
                    "start_year": year_1,
                    "end_year": year_2,
                },
            )
        )
        assert response.status_code == 403

        response = self.client.get(
            reverse(
                "replenishment-status-of-contributions-summary",
            )
        )
        assert response.status_code == 403

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

        response = self.client.get(
            reverse(
                "replenishment-status-of-contributions-annual",
                kwargs={
                    "year": year_1,
                },
            )
        )
        assert response.data == {}

        response = self.client.get(
            reverse(
                "replenishment-status-of-contributions-triennial",
                kwargs={
                    "start_year": year_1,
                    "end_year": year_2,
                },
            )
        )
        assert response.data == {}

        response = self.client.get(
            reverse(
                "replenishment-status-of-contributions-summary",
            )
        )
        assert response.data == {}


class TestDisputedContributions(BaseTest):
    url = reverse("replenishment-disputed-contributions-list")

    def test_create_disputed_contributions(self, user):
        country = CountryFactory.create(name="Country 1", iso3="XYZ")

        self.client.force_authenticate(user=user)
        self.client.post(
            self.url,
            {
                "country": country.id,
                "year": 2020,
                "amount": "100",
                "comment": "Comment",
            },
            format="json",
        )

        assert DisputedContribution.objects.count() == 1

    def test_delete_disputed_contributions(self, user):
        disputed = DisputedContributionsFactory.create()

        self.client.force_authenticate(user=user)
        self.client.delete(
            reverse("replenishment-disputed-contributions-detail", args=[disputed.id])
        )

        assert DisputedContribution.objects.count() == 0


class TestReplenishmentDashboard(BaseTest):
    url = reverse("replenishment-dashboard")
    fifteen_decimals = decimal.Decimal("0.000000000000001")
    year_1 = 2021
    year_2 = 2023
    year_3 = 2024
    year_4 = 2026

    def test_replenishment_dashboard(self, user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")

        replenishment = ReplenishmentFactory.create(
            start_year=self.year_3, end_year=self.year_4
        )
        ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment, is_final=True
        )

        contribution_1 = TriennialContributionStatusFactory.create(
            country=country_1, start_year=self.year_1, end_year=self.year_2
        )
        contribution_2 = TriennialContributionStatusFactory.create(
            country=country_1, start_year=self.year_3, end_year=self.year_4
        )
        contribution_3 = TriennialContributionStatusFactory.create(
            country=country_2, start_year=self.year_1, end_year=self.year_2
        )
        contribution_4 = TriennialContributionStatusFactory.create(
            country=country_2, start_year=self.year_3, end_year=self.year_4
        )

        DisputedContributionsFactory.create(year=self.year_1)
        DisputedContributionsFactory.create(year=self.year_3)

        ferm_gain_loss_1 = FermGainLossFactory.create(country=country_1)
        ferm_gain_loss_2 = FermGainLossFactory.create(country=country_2)

        external_income = ExternalIncome.objects.create(
            interest_earned=decimal.Decimal("100"),
            miscellaneous_income=decimal.Decimal("200"),
        )

        external_allocation = ExternalAllocation.objects.create(
            undp=decimal.Decimal("100"),
            unep=decimal.Decimal("100"),
            unido=decimal.Decimal("100"),
            world_bank=decimal.Decimal("100"),
            staff_contracts=decimal.Decimal("100"),
            treasury_fees=decimal.Decimal("100"),
            monitoring_fees=decimal.Decimal("100"),
            technical_audit=decimal.Decimal("100"),
            information_strategy=decimal.Decimal("100"),
        )

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        payment_pledge_percentage = (
            (
                contribution_2.cash_payments
                + contribution_4.cash_payments
                + contribution_2.bilateral_assistance
                + contribution_4.bilateral_assistance
                + contribution_2.promissory_notes
                + contribution_4.promissory_notes
            )
            / (
                contribution_2.agreed_contributions
                + contribution_4.agreed_contributions
            )
            * Decimal("100")
        )

        zero_decimal = Decimal("0")
        country_1_outstanding = (
            contribution_1.outstanding_contributions
            + contribution_2.outstanding_contributions
        )
        country_2_outstanding = (
            contribution_3.outstanding_contributions
            + contribution_4.outstanding_contributions
        )
        correct_response = {
            "overview": {
                "payment_pledge_percentage": payment_pledge_percentage,
                "gain_loss": (
                    ferm_gain_loss_1.amount + ferm_gain_loss_2.amount
                ).quantize(self.fifteen_decimals),
                "parties_paid_in_advance_count": int(
                    country_1_outstanding < zero_decimal
                )
                + int(country_2_outstanding < zero_decimal),
                "parties_paid_count": int(country_1_outstanding == zero_decimal)
                + int(country_2_outstanding == zero_decimal),
                "parties_have_to_pay_count": int(country_1_outstanding > zero_decimal)
                + int(country_2_outstanding > zero_decimal),
            },
            "income": {
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
                "interest_earned": external_income.interest_earned.quantize(
                    self.fifteen_decimals
                ),
                "promissory_notes": (
                    contribution_1.promissory_notes
                    + contribution_2.promissory_notes
                    + contribution_3.promissory_notes
                    + contribution_4.promissory_notes
                ).quantize(self.fifteen_decimals),
                "miscellaneous_income": external_income.miscellaneous_income.quantize(
                    self.fifteen_decimals
                ),
            },
            "allocations": {
                "undp": external_allocation.undp.quantize(self.fifteen_decimals),
                "unep": external_allocation.unep.quantize(self.fifteen_decimals),
                "unido": external_allocation.unido.quantize(self.fifteen_decimals),
                "world_bank": external_allocation.world_bank.quantize(
                    self.fifteen_decimals
                ),
                "staff_contracts": external_allocation.staff_contracts.quantize(
                    self.fifteen_decimals
                ),
                "treasury_fees": external_allocation.treasury_fees.quantize(
                    self.fifteen_decimals
                ),
                "monitoring_fees": external_allocation.monitoring_fees.quantize(
                    self.fifteen_decimals
                ),
                "technical_audit": external_allocation.technical_audit.quantize(
                    self.fifteen_decimals
                ),
                "information_strategy": external_allocation.information_strategy.quantize(
                    self.fifteen_decimals
                ),
                "bilateral_assistance": (
                    contribution_1.bilateral_assistance
                    + contribution_2.bilateral_assistance
                    + contribution_3.bilateral_assistance
                    + contribution_4.bilateral_assistance
                ).quantize(self.fifteen_decimals),
                "gain_loss": (
                    ferm_gain_loss_1.amount + ferm_gain_loss_2.amount
                ).quantize(self.fifteen_decimals),
            },
            "charts": {
                "outstanding_pledges": [
                    {
                        "start_year": self.year_1,
                        "end_year": self.year_2,
                        "outstanding_pledges": (
                            contribution_1.outstanding_contributions
                            + contribution_3.outstanding_contributions
                        ).quantize(self.fifteen_decimals),
                    },
                    {
                        "start_year": self.year_3,
                        "end_year": self.year_4,
                        "outstanding_pledges": (
                            contribution_2.outstanding_contributions
                            + contribution_4.outstanding_contributions
                        ).quantize(self.fifteen_decimals),
                    },
                ],
                "pledged_contributions": [
                    {
                        "start_year": self.year_1,
                        "end_year": self.year_2,
                        "agreed_pledges": (
                            contribution_1.agreed_contributions
                            + contribution_3.agreed_contributions
                        ).quantize(self.fifteen_decimals),
                    },
                    {
                        "start_year": self.year_3,
                        "end_year": self.year_4,
                        "agreed_pledges": (
                            contribution_2.agreed_contributions
                            + contribution_4.agreed_contributions
                        ).quantize(self.fifteen_decimals),
                    },
                ],
                "payments": [
                    {
                        "start_year": self.year_1,
                        "end_year": self.year_2,
                        "total_payments": (
                            contribution_1.cash_payments + contribution_3.cash_payments
                        ).quantize(self.fifteen_decimals),
                    },
                    {
                        "start_year": self.year_3,
                        "end_year": self.year_4,
                        "total_payments": (
                            contribution_2.cash_payments + contribution_4.cash_payments
                        ).quantize(self.fifteen_decimals),
                    },
                ],
            },
        }

        correct_response["overview"]["balance"] = (
            correct_response["income"]["cash_payments"]
            + correct_response["income"]["bilateral_assistance"]
            + correct_response["income"]["interest_earned"]
            + correct_response["income"]["promissory_notes"]
            + correct_response["income"]["miscellaneous_income"]
            - correct_response["allocations"]["undp"]
            - correct_response["allocations"]["unep"]
            - correct_response["allocations"]["unido"]
            - correct_response["allocations"]["world_bank"]
            - correct_response["allocations"]["staff_contracts"]
            - correct_response["allocations"]["treasury_fees"]
            - correct_response["allocations"]["monitoring_fees"]
            - correct_response["allocations"]["technical_audit"]
            - correct_response["allocations"]["information_strategy"]
            - correct_response["allocations"]["bilateral_assistance"]
            - correct_response["allocations"]["gain_loss"]
        ).quantize(self.fifteen_decimals)

        assert response.data == correct_response


class TestScaleOfAssessmentWorkflow:
    client = APIClient()
    url_replenishment = reverse("replenishment-replenishments-list")
    url_scale_of_assessment = reverse("replenishment-scales-of-assessment-list")

    def test_without_login(self):
        response = self.client.get(self.url_replenishment)
        assert response.status_code == 403

        response = self.client.get(self.url_scale_of_assessment)
        assert response.status_code == 403

    def test_create_replenishment_while_ongoing(self, user):
        replenishment_1 = ReplenishmentFactory.create(start_year=2021, end_year=2023)
        replenishment_2 = ReplenishmentFactory.create(start_year=2024, end_year=2026)

        ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment_1, version=0, is_final=True
        )
        ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment_2, version=0, is_final=False
        )

        self.client.force_authenticate(user=user)

        response = self.client.post(
            self.url_replenishment,
            {
                "amount": 2000,
            },
            format="json",
        )

        # Bad request, latest replenishment is still ongoing
        assert response.status_code == 400

    def test_create_replenishment_simple(self, user):
        replenishment_1 = ReplenishmentFactory.create(start_year=2021, end_year=2023)
        replenishment_2 = ReplenishmentFactory.create(start_year=2024, end_year=2026)

        ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment_1, version=0, is_final=True
        )
        ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment_2, version=0, is_final=True
        )

        self.client.force_authenticate(user=user)

        response = self.client.post(
            self.url_replenishment,
            {
                "amount": 2000,
            },
            format="json",
        )

        assert response.status_code == 201
        assert response.data["start_year"] == 2027
        assert response.data["end_year"] == 2029

        assert Replenishment.objects.all().count() == 3
        assert (
            ScaleOfAssessmentVersion.objects.filter(
                replenishment=response.data["id"]
            ).count()
            == 1
        )

    def test_create_replenishment_with_scales_of_assessment(self, user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")
        country_3 = CountryFactory.create(name="Country 3", iso3="DEF")
        replenishment_1 = ReplenishmentFactory.create(start_year=2021, end_year=2023)
        replenishment_2 = ReplenishmentFactory.create(start_year=2024, end_year=2026)

        version_1 = ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment_1, version=0, is_final=True
        )
        version_2 = ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment_2, version=0, is_final=True
        )

        ScaleOfAssessmentFactory.create(
            country=country_1,
            version=version_1,
        )
        ScaleOfAssessmentFactory.create(
            country=country_2,
            version=version_1,
        )
        ScaleOfAssessmentFactory.create(
            country=country_3,
            version=version_1,
        )

        ScaleOfAssessmentFactory.create(
            country=country_1,
            version=version_2,
            currency="USD",
        )
        ScaleOfAssessmentFactory.create(
            country=country_2,
            version=version_2,
            currency="USD",
        )
        ScaleOfAssessmentFactory.create(
            country=country_3,
            version=version_2,
            currency="USD",
        )

        self.client.force_authenticate(user=user)

        response = self.client.post(
            self.url_replenishment,
            {
                "amount": 2000,
            },
            format="json",
        )

        assert response.status_code == 201
        assert response.data["start_year"] == 2027
        assert response.data["end_year"] == 2029
        assert Replenishment.objects.all().count() == 3
        assert (
            ScaleOfAssessmentVersion.objects.filter(
                replenishment=response.data["id"]
            ).count()
            == 1
        )
        assert (
            ScaleOfAssessment.objects.filter(
                version__replenishment=response.data["id"]
            ).count()
            == 3
        )
        for soa in ScaleOfAssessment.objects.filter(
            version__replenishment=response.data["id"]
        ):
            assert soa.currency == "USD"

    def test_update_scales_of_assessment_bad_replenishment(self, user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")
        country_3 = CountryFactory.create(name="Country 3", iso3="DEF")
        replenishment = ReplenishmentFactory.create(
            start_year=2021, end_year=2023, amount=500
        )

        version = ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment, version=0, is_final=True
        )

        ScaleOfAssessmentFactory.create(
            country=country_1,
            version=version,
        )
        ScaleOfAssessmentFactory.create(
            country=country_2,
            version=version,
        )
        ScaleOfAssessmentFactory.create(
            country=country_3,
            version=version,
        )

        self.client.force_authenticate(user=user)

        response = self.client.post(
            self.url_scale_of_assessment,
            {
                "replenishment_id": replenishment.id + 10,
                "amount": 1000,
                "data": [],
                "final": False,
            },
            format="json",
        )

        assert response.status_code == 400

    def test_update_scales_of_assessment_already_finalized(self, user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")
        country_3 = CountryFactory.create(name="Country 3", iso3="DEF")
        replenishment = ReplenishmentFactory.create(
            start_year=2021, end_year=2023, amount=500
        )

        version = ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment, version=0, is_final=True
        )

        ScaleOfAssessmentFactory.create(
            country=country_1,
            version=version,
        )
        ScaleOfAssessmentFactory.create(
            country=country_2,
            version=version,
        )
        ScaleOfAssessmentFactory.create(
            country=country_3,
            version=version,
        )

        self.client.force_authenticate(user=user)

        post_data = {
            "replenishment_id": replenishment.id,
            "amount": 1000,
            "meeting": "meeting",
            "decision": "decision",
            "data": [
                {
                    "country_id": country_1.id,
                    "average_inflation_rate": Decimal("4.49233333333333"),
                    "exchange_rate": Decimal("0.92358"),
                    "currency": "",
                    "un_scale_of_assessment": Decimal("0.005"),
                },
                {
                    "country_id": country_2.id,
                    "average_inflation_rate": Decimal("4.927666666666667"),
                    "exchange_rate": Decimal("1.48183"),
                    "currency": "Australian Dollar",
                    "un_scale_of_assessment": Decimal("2.111"),
                },
                {
                    "country_id": country_3.id,
                    "average_inflation_rate": Decimal("6.513000000000001"),
                    "exchange_rate": Decimal("0.92358"),
                    "currency": "Euro",
                    "un_scale_of_assessment": Decimal("0.679"),
                },
            ],
            "final": True,
        }
        response = self.client.post(
            self.url_scale_of_assessment,
            post_data,
            format="json",
        )

        assert response.status_code == 400

    def test_update_scales_of_assessment(self, user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")
        country_3 = CountryFactory.create(name="Country 3", iso3="DEF")
        replenishment = ReplenishmentFactory.create(
            start_year=2021, end_year=2023, amount=500
        )

        version = ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment, version=0, is_final=False
        )

        ScaleOfAssessmentFactory.create(
            country=country_1,
            version=version,
        )
        ScaleOfAssessmentFactory.create(
            country=country_2,
            version=version,
        )
        ScaleOfAssessmentFactory.create(
            country=country_3,
            version=version,
        )

        self.client.force_authenticate(user=user)

        post_data = {
            "replenishment_id": replenishment.id,
            "amount": 1000,
            "meeting": "meeting",
            "decision": "decision",
            "data": [
                {
                    "country_id": country_1.id,
                    "average_inflation_rate": Decimal("4.49233333333333"),
                    "exchange_rate": Decimal("0.92358"),
                    "currency": "",
                    "un_scale_of_assessment": Decimal("0.005"),
                },
                {
                    "country_id": country_2.id,
                    "average_inflation_rate": Decimal("4.927666666666667"),
                    "exchange_rate": Decimal("1.48183"),
                    "currency": "Australian Dollar",
                    "un_scale_of_assessment": Decimal("2.111"),
                },
                {
                    "country_id": country_3.id,
                    "average_inflation_rate": Decimal("6.513000000000001"),
                    "exchange_rate": Decimal("0.92358"),
                    "currency": "Euro",
                    "un_scale_of_assessment": Decimal("0.679"),
                },
            ],
            "final": False,
        }
        response = self.client.post(
            self.url_scale_of_assessment,
            post_data,
            format="json",
        )

        assert response.status_code == 200
        replenishment.refresh_from_db()
        assert replenishment.amount == 1000

        assert Country.objects.all().count() == 3
        assert Replenishment.objects.all().count() == 1
        # No new version
        assert ScaleOfAssessmentVersion.objects.all().count() == 1
        assert ScaleOfAssessment.objects.all().count() == 3

        assert (
            list(
                ScaleOfAssessment.objects.values(
                    "country_id",
                    "average_inflation_rate",
                    "exchange_rate",
                    "currency",
                    "un_scale_of_assessment",
                ).order_by("country__name")
            )
            == post_data["data"]
        )

    def test_update_scales_of_assessment_final(self, user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")
        country_3 = CountryFactory.create(name="Country 3", iso3="DEF")
        replenishment = ReplenishmentFactory.create(
            start_year=2021, end_year=2023, amount=500
        )

        version = ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment, version=0, is_final=False
        )

        ScaleOfAssessmentFactory.create(
            country=country_1,
            version=version,
        )
        ScaleOfAssessmentFactory.create(
            country=country_2,
            version=version,
        )
        ScaleOfAssessmentFactory.create(
            country=country_3,
            version=version,
        )

        self.client.force_authenticate(user=user)

        post_data = {
            "replenishment_id": replenishment.id,
            "amount": 1000,
            "meeting": "meeting",
            "decision": "decision",
            "data": [
                {
                    "country_id": country_1.id,
                    "average_inflation_rate": Decimal("4.49233333333333"),
                    "exchange_rate": Decimal("0.92358"),
                    "currency": "",
                    "un_scale_of_assessment": Decimal("0.005"),
                },
                {
                    "country_id": country_2.id,
                    "average_inflation_rate": Decimal("4.927666666666667"),
                    "exchange_rate": Decimal("1.48183"),
                    "currency": "Australian Dollar",
                    "un_scale_of_assessment": Decimal("2.111"),
                },
                {
                    "country_id": country_3.id,
                    "average_inflation_rate": Decimal("6.513000000000001"),
                    "exchange_rate": Decimal("0.92358"),
                    "currency": "Euro",
                    "un_scale_of_assessment": Decimal("0.679"),
                },
            ],
            "final": True,
        }
        response = self.client.post(
            self.url_scale_of_assessment,
            post_data,
            format="json",
        )

        assert response.status_code == 201
        replenishment.refresh_from_db()
        assert replenishment.amount == 1000

        assert Country.objects.all().count() == 3
        assert Replenishment.objects.all().count() == 1
        # A new version is created
        assert ScaleOfAssessmentVersion.objects.all().count() == 2
        assert ScaleOfAssessment.objects.all().count() == 6

        assert (
            list(
                ScaleOfAssessment.objects.filter(version__version=1)
                .values(
                    "country_id",
                    "average_inflation_rate",
                    "exchange_rate",
                    "currency",
                    "un_scale_of_assessment",
                )
                .order_by("country__name")
            )
            == post_data["data"]
        )

    def test_update_scales_of_assessment_new_version(self, user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")
        country_3 = CountryFactory.create(name="Country 3", iso3="DEF")
        replenishment = ReplenishmentFactory.create(
            start_year=2021, end_year=2023, amount=500
        )

        version = ScaleOfAssessmentVersionFactory.create(
            replenishment=replenishment, version=0, is_final=False
        )

        ScaleOfAssessmentFactory.create(
            country=country_1,
            version=version,
        )
        ScaleOfAssessmentFactory.create(
            country=country_2,
            version=version,
        )
        ScaleOfAssessmentFactory.create(
            country=country_3,
            version=version,
        )

        self.client.force_authenticate(user=user)

        post_data = {
            "replenishment_id": replenishment.id,
            "createNewVersion": "on",
            "amount": 1000,
            "meeting": "meeting",
            "decision": "decision",
            "data": [
                {
                    "country_id": country_1.id,
                    "average_inflation_rate": Decimal("4.49233333333333"),
                    "exchange_rate": Decimal("0.92358"),
                    "currency": "",
                    "un_scale_of_assessment": Decimal("0.005"),
                },
                {
                    "country_id": country_2.id,
                    "average_inflation_rate": Decimal("4.927666666666667"),
                    "exchange_rate": Decimal("1.48183"),
                    "currency": "Australian Dollar",
                    "un_scale_of_assessment": Decimal("2.111"),
                },
                {
                    "country_id": country_3.id,
                    "average_inflation_rate": Decimal("6.513000000000001"),
                    "exchange_rate": Decimal("0.92358"),
                    "currency": "Euro",
                    "un_scale_of_assessment": Decimal("0.679"),
                },
            ],
            "final": False,
        }
        response = self.client.post(
            self.url_scale_of_assessment,
            post_data,
            format="json",
        )

        assert response.status_code == 201
        replenishment.refresh_from_db()
        assert replenishment.amount == 1000

        assert Country.objects.all().count() == 3
        assert Replenishment.objects.all().count() == 1
        # A new version is created
        assert ScaleOfAssessmentVersion.objects.all().count() == 2
        assert ScaleOfAssessment.objects.all().count() == 6

        assert (
            list(
                ScaleOfAssessment.objects.filter(version__version=1)
                .values(
                    "country_id",
                    "average_inflation_rate",
                    "exchange_rate",
                    "currency",
                    "un_scale_of_assessment",
                )
                .order_by("country__name")
            )
            == post_data["data"]
        )


class TestInvoices(BaseTest):
    url = reverse("replenishment-invoices-list")
    year_1 = 2021
    year_2 = 2023
    year_3 = 2024
    year_4 = 2026

    def test_invoices_list(self, user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")

        replenishment_1 = ReplenishmentFactory.create(
            start_year=self.year_1, end_year=self.year_2
        )
        replenishment_2 = ReplenishmentFactory.create(
            start_year=self.year_3, end_year=self.year_4
        )

        InvoiceFactory(
            country=country_1, replenishment=replenishment_1, number="aaa-yyy-1"
        )
        InvoiceFactory(
            country=country_2, replenishment=replenishment_2, number="aaa-yyy-2"
        )

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2

        response_1 = self.client.get(
            self.url, {"replenishment_start": replenishment_1.start_year}
        )
        assert response_1.status_code == 200
        assert len(response_1.data) == 1
        assert response_1.data[0]["number"] == "aaa-yyy-1"

        response_2 = self.client.get(self.url, {"country_id": country_2.id})
        assert response_2.status_code == 200
        assert len(response_2.data) == 1
        assert response_2.data[0]["number"] == "aaa-yyy-2"

        response_all = self.client.get(self.url, {"start_year": "all"})
        assert response_all.status_code == 200
        assert len(response_all.data) == 2

    def test_invoices_create(self, user):
        country = CountryFactory.create(name="Country 1", iso3="XYZ")
        replenishment = ReplenishmentFactory.create(
            start_year=self.year_1, end_year=self.year_2
        )

        self.client.force_authenticate(user=user)

        request_data = {
            "country_id": country.id,
            "replenishment_id": replenishment.id,
            "amount": 100.0,
            "currency": "EUR",
            "exchange_rate": 0.7,
            "number": "aaa-yyy-create-1",
            "date_of_issuance": "2019-03-14",
            "date_sent_out": None,
            "files": [],
        }

        response = self.client.post(self.url, data=request_data, format="json")
        assert response.status_code == 201

    def test_invoices_update(self, user):
        country = CountryFactory.create(name="Country 1", iso3="XYZ")
        replenishment = ReplenishmentFactory.create(
            start_year=self.year_1, end_year=self.year_2
        )
        invoice = InvoiceFactory(
            country=country, replenishment=replenishment, number="aaa-yyy-1"
        )

        self.client.force_authenticate(user=user)

        request_data = {
            "country_id": country.id,
            "replenishment_id": replenishment.id,
            "amount": 100.0,
            "currency": "EUR",
            "exchange_rate": 0.7,
            "number": "aaa-yyy-create-1",
            "date_of_issuance": "2019-03-14",
            "date_sent_out": None,
            "files": [],
        }

        response = self.client.put(
            self.url + f"{invoice.id}/", data=request_data, format="json"
        )
        assert response.status_code == 200


class TestPayments(BaseTest):
    url = reverse("replenishment-payments-list")
    year_1 = 2021
    year_2 = 2023
    year_3 = 2024
    year_4 = 2026

    def test_payments_list(self, user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")

        replenishment = ReplenishmentFactory.create(
            start_year=self.year_3, end_year=self.year_4
        )

        PaymentFactory(country=country_1, replenishment=None)
        PaymentFactory(country=country_2, replenishment=replenishment)

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2

    def test_payments_create(self, user):
        country = CountryFactory.create(name="Country 1", iso3="XYZ")

        self.client.force_authenticate(user=user)

        request_data = {
            "country_id": country.id,
            "replenishment_id": None,
            "date": "2019-03-14",
            "payment_for_year": "deferred",
            "amount": 100.0,
            "currency": "EUR",
            "exchange_rate": 0.7,
            "ferm_gain_or_loss": None,
            "files": [],
        }

        response = self.client.post(self.url, data=request_data, format="json")
        assert response.status_code == 201
