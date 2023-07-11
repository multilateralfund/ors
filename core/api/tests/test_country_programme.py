import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.factories import (
    AdmChoiceFactory,
    AdmColumnFactory,
    AdmRecordFactory,
    AdmRowFactory,
    BlendFactory,
    CPGenerationFactory,
    CPPricesFactory,
    CountryFactory,
    CPRecordFactory,
    CPReportFactory,
    CPUsageFactory,
    SubstanceFactory,
    UserFactory,
)
from core.models.country_programme import CPEmission

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

    def test_get_new_cp_record_list(self):
        url = reverse("country-programme-record-list")

        # test without authentication
        response = self.client.get(url)
        assert response.status_code == 403

        self.client.force_authenticate(user=UserFactory())

        # create chemicals
        substance = SubstanceFactory.create(name="substance123")
        blend = BlendFactory.create(name="blend123")

        # create country and cp report
        ro = CountryFactory.create(name="Romania")
        cp_report = CPReportFactory.create(
            country=ro, year=2020, comment="Si daca e rau, tot e bine"
        )

        # section A
        CPRecordFactory.create(
            country_programme_report=cp_report, section="A", substance=substance
        )
        # section B
        cp_rec = CPRecordFactory.create(
            country_programme_report=cp_report, section="B", blend=blend
        )
        # add 3 usages for one record
        for _ in range(3):
            CPUsageFactory.create(country_programme_record=cp_rec)

        # section C (prices)
        CPPricesFactory.create(country_programme_report=cp_report, blend=blend)
        CPPricesFactory.create(country_programme_report=cp_report, substance=substance)

        # section D (generation)
        CPGenerationFactory.create(country_programme_report=cp_report)

        # section E (emissions)
        for _ in range(2):
            CPEmission.objects.create(country_programme_report=cp_report)

        # try get cp records list without cp report id
        response = self.client.get(url)
        assert response.status_code == 400

        # try get cp records list with invalid cp report id
        response = self.client.get(url, {"cp_report_id": 999})

        # get cp records list
        response = self.client.get(url, {"cp_report_id": cp_report.id})
        assert response.status_code == 200
        assert len(response.data["section_a"]) == 1
        assert response.data["section_a"][0]["chemical_name"] == "substance123"
        assert len(response.data["section_b"]) == 1
        assert response.data["section_b"][0]["chemical_name"] == "blend123"
        assert len(response.data["section_b"][0]["usages"]) == 3
        assert len(response.data["section_c"]) == 2
        assert len(response.data["section_d"]) == 1
        assert response.data["section_d"][0]["chemical_name"] == "HFC-23"
        assert len(response.data["section_e"]) == 2
        assert response.data["section_f"]["remarks"] == "Si daca e rau, tot e bine"

    def test_get_old_cp_record_list(self):
        url = reverse("country-programme-record-list")
        self.client.force_authenticate(user=UserFactory())

        # create chemicals
        substance = SubstanceFactory.create(name="substance123")
        blend = BlendFactory.create(name="blend123")

        # create country and cp report
        ro = CountryFactory.create(name="Romania")
        cp_report = CPReportFactory.create(
            country=ro, year=2000, comment="Si daca e rau, tot e bine"
        )

        # section A
        cp_rec = CPRecordFactory.create(
            country_programme_report=cp_report, section="A", substance=substance
        )
        # add 3 usages for one record
        for _ in range(3):
            CPUsageFactory.create(country_programme_record=cp_rec)

        # section C (prices)
        CPPricesFactory.create(country_programme_report=cp_report, blend=blend)
        CPPricesFactory.create(country_programme_report=cp_report, substance=substance)

        # create rows and columns
        rows = {}
        columns = {}
        for section in ["B", "C", "D"]:
            data = {
                "section": section,
                "min_year": 1995,
                "max_year": 2010,
            }
            if section != "D":
                columns[section] = AdmColumnFactory.create(
                    display_name=f"adm_column_{section}", sort_order=1, **data
                )

            rows[section] = AdmRowFactory.create(
                text=f"row{section}",
                index=None,
                type="question",
                parent=None,
                **data,
            )
            if section == "D":
                # creat choices
                for i in range(3):
                    last_choice = AdmChoiceFactory.create(
                        adm_row=rows[section],
                        value="choice1",
                        sort_order=i,
                    )

        # create records
        for section in ["B", "C", "D"]:
            record_data = {
                "country_programme_report": cp_report,
                "row": rows[section],
                "column": columns.get(section, None),
                "value_text": f"record_{section}",
                "section": section,
            }
            if section == "D":
                record_data["value_choice"] = last_choice
            AdmRecordFactory.create(**record_data)

        # check response
        response = self.client.get(url, {"cp_report_id": cp_report.id})
        assert response.status_code == 200
        assert len(response.data["section_a"]) == 1
        assert len(response.data["adm_b"]) == 1
        assert response.data["adm_b"][0]["row_text"] == "rowB"
        assert response.data["adm_b"][0]["values"][0]["value_text"] == "record_B"
        assert len(response.data["section_c"]) == 2
        assert len(response.data["adm_c"]) == 1
        assert len(response.data["adm_d"]) == 1
        assert response.data["adm_d"][0]["value_choice_id"] == last_choice.id


class TestCPSettings:
    client = APIClient()

    def test_get_cp_settings(self):
        url = reverse("country-programme-settings")

        # test without authentication
        response = self.client.get(url)
        assert response.status_code == 403

        self.client.force_authenticate(user=UserFactory())

        # get cp settings
        response = self.client.get(url)
        assert response.status_code == 200
