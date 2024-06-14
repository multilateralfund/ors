import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import CountryFactory


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
