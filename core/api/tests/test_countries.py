from core.api.tests.factories import CountryFactory, UserFactory
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


# pylint: disable=C8008
class TestCountries:
    client = APIClient()

    def test_countries_list(self):
        # add some countries using factory
        for country in ["Romania", "France"]:
            country = CountryFactory.create(name=country)

        # test without authentication
        url = reverse("countries-list")
        response = self.client.get(url)
        assert response.status_code == 403

        self.client.force_authenticate(user=UserFactory())

        # get countries list
        url = reverse("countries-list")
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["name"] == "France"
        assert response.data[1]["name"] == "Romania"
