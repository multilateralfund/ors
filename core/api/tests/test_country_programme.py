from core.api.tests.factories import (
    CountryFactory,
    CountryProgrammeReportFactory,
    UserFactory,
)
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


class TestCountryProgrammeReport:
    client = APIClient()

    def test_get_cp_report_list(self):
        # test without authentication
        url = reverse("country-programme-report-list")

        response = self.client.get(url)
        assert response.status_code == 403

        self.client.force_authenticate(user=UserFactory())

        # get cp reports list
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 0

        # add some cp reports using factories
        for country in ["Romania", "Bulgaria", "Hungary"]:
            country = CountryFactory.create(name=country)
            for i in range(3):
                year = 2010 + i
                CountryProgrammeReportFactory.create(
                    country=country, name=country.name + str(year), year=year
                )

        # get cp reports list
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 9
        assert response.data[0]["name"] == "Bulgaria2010"
        assert response.data[8]["name"] == "Romania2012"

        # get cp reports list with filters
        # filter by country id (country = Hungary)
        response = self.client.get(url, {"country_id": country.id})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["name"] == "Hungary2010"

        # filter by name (name contains "man")
        response = self.client.get(url, {"name": "man"})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["name"] == "Romania2010"

        # filter by year (year = 2011)
        response = self.client.get(url, {"year": 2011})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["name"] == "Bulgaria2011"
        assert response.data[0]["year"] == 2011
