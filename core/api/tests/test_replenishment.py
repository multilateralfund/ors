import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    CountryFactory,
    ReplenishmentFactory,
    ContributionFactory,
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
        replenishment_1 = ReplenishmentFactory.create(start_year=2020)
        replenishment_2 = ReplenishmentFactory.create(start_year=2021)

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2

        assert response.data[0]["start_year"] == 2021
        assert response.data[0]["id"] == replenishment_2.id
        assert response.data[1]["start_year"] == 2020
        assert response.data[1]["id"] == replenishment_1.id

    def test_replenishments_list_country_user(self, country_user):
        ReplenishmentFactory.create()
        ReplenishmentFactory.create()

        self.client.force_authenticate(user=country_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 0


class TestContributions(BaseTest):
    url = reverse("replenishment-contributions-list")

    def test_contributions_list(self, user):
        country_1 = CountryFactory.create(name="Country 1", iso3="XYZ")
        country_2 = CountryFactory.create(name="Country 2", iso3="ABC")
        contribution_1 = ContributionFactory.create(country=country_1)
        contribution_2 = ContributionFactory.create(country=country_2)

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

    def test_contributions_list_filtered(self, user):
        replenishment_1 = ReplenishmentFactory.create(start_year=2020)
        replenishment_2 = ReplenishmentFactory.create(start_year=2021)
        contribution_1 = ContributionFactory.create(replenishment=replenishment_1)
        ContributionFactory.create(replenishment=replenishment_2)

        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"start_year": replenishment_1.start_year})
        assert response.status_code == 200
        assert len(response.data) == 1

        assert response.data[0]["country"]["name"] == contribution_1.country.name
        assert (
            response.data[0]["replenishment"]["start_year"]
            == replenishment_1.start_year
        )

    def test_contributions_list_country_user(self, country_user):
        ContributionFactory.create()
        ContributionFactory.create()

        self.client.force_authenticate(user=country_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 0