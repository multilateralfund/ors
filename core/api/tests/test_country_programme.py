from core.api.tests.factories import (
    BlendFactory,
    CountryFactory,
    CPRecordFactory,
    CPReportFactory,
    CPUsageFactory,
    SubstanceFactory,
    UserFactory,
)
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


# pylint: disable=C8008
class TestCPReport:
    client = APIClient()

    def test_get_cp_report_list(self):
        url = reverse("country-programme-report-list")

        # test without authentication
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
                CPReportFactory.create(
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


class TestCPRecord:
    client = APIClient()

    def test_get_cp_record_list(self):
        url = reverse("country-programme-record-list")

        # test without authentication
        response = self.client.get(url)
        assert response.status_code == 403

        self.client.force_authenticate(user=UserFactory())

        # get cp records list
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 0

        # add 2 country programme reports with 2 record each
        substance = SubstanceFactory.create()
        blend = BlendFactory.create()
        for i, country in enumerate(["Romania", "Bulgaria"]):
            country = CountryFactory.create(name=country)
            cp_report = CPReportFactory.create(country=country, year=2010 + i)
            CPRecordFactory.create(
                country_programme_report=cp_report, section="A", substance=substance
            )
            cp_rec = CPRecordFactory.create(
                country_programme_report=cp_report, section="B", blend=blend
            )
            # add 3 usages for one record
            for _ in range(3):
                CPUsageFactory.create(country_programme_record=cp_rec)

        # get cp records list
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 4
        assert response.data[0]["section"] == "A"
        assert response.data[0]["substance"] == str(substance)
        assert response.data[3]["section"] == "B"
        assert response.data[3]["blend"] == str(blend)
        assert len(response.data[3]["record_usages"]) == 3

        # get cp records list with filters
        # filter by country programme id (country programme = Bulgaria2011)
        response = self.client.get(url, {"country_programme_report_id": cp_report.id})
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["country_programme_report_id"] == cp_report.id

        # filter by section (section = A)
        response = self.client.get(url, {"section": "A"})
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["section"] == "A"

        # filter by substance id (substance = substance)
        response = self.client.get(url, {"substance_id": substance.id})
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["substance"] == str(substance)

        # filter by blend id (blend = blend)
        response = self.client.get(url, {"blend_id": blend.id})
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["blend"] == str(blend)

        # filter by country_id (country = Bulgaria)
        response = self.client.get(url, {"country_id": country.id})
        assert response.status_code == 200
        assert len(response.data) == 2

        # filter by year (year = 2011)
        response = self.client.get(url, {"year": 2011})
        assert response.status_code == 200
        assert len(response.data) == 2
