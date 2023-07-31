from core.api.tests.factories import CountryFactory
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


@pytest.fixture(name="_setup_countries")
def setup_countries():
    CountryFactory.create(name="France")


# pylint: disable=C8008
class TestCountries:
    client = APIClient()
    url = reverse("countries-list")

    def test_countries_list_annon(self, country_ro):
        response = self.client.get(self.url)
        assert response.status_code == 403

    def test_countries_list(self, user, country_ro, _setup_countries):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["name"] == "France"
        assert response.data[1]["name"] == country_ro.name
