from core.api.tests.base import BaseTest
from core.api.tests.factories import CountryFactory
import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db
# pylint: disable=C8008


@pytest.fixture(name="_setup_countries")
def setup_countries():
    CountryFactory.create(name="France")


class TestCountries(BaseTest):
    url = reverse("countries-list")

    def test_countries_list(self, user, country_ro, _setup_countries):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["name"] == "France"
        assert response.data[1]["name"] == country_ro.name
