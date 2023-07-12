from core.api.tests.factories import CountryFactory
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


# pylint: disable=C8008
class TestCountries:
    client = APIClient()

    def test_countries_list(self, user, country_ro):
        # add some countries using factory
        CountryFactory.create(name="France")

        # test without authentication
        url = reverse("countries-list")
        response = self.client.get(url)
        assert response.status_code == 403

        self.client.force_authenticate(user=user)

        # get countries list
        url = reverse("countries-list")
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["name"] == "France"
        assert response.data[1]["name"] == country_ro.name
