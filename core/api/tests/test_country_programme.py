import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.factories import (
    AdmChoiceFactory,
    AdmColumnFactory,
    AdmRecordFactory,
    AdmRowFactory,
    CPGenerationFactory,
    CPPricesFactory,
    CountryFactory,
    CPRecordFactory,
    CPReportFactory,
    CPUsageFactory,
)
from core.models.country_programme import CPEmission

pytestmark = pytest.mark.django_db


@pytest.fixture(name="_setup_cp_report_list")
def setup_cp_report_list():
    for country in ["Romania", "Bulgaria", "Hungary"]:
        country = CountryFactory.create(name=country)
        for i in range(3):
            year = 2010 + i
            CPReportFactory.create(
                country=country, name=country.name + str(year), year=year
            )

    return country


# pylint: disable=C8008
class TestCPReport:
    client = APIClient()
    url = reverse("country-programme-report-list")

    def test_get_cp_report_list_annon(self):
        response = self.client.get(self.url)
        assert response.status_code == 403

    def test_get_cp_report_list(self, user, _setup_cp_report_list):
        self.client.force_authenticate(user=user)

        # get cp reports list
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 9
        assert response.data[0]["name"] == "Bulgaria2010"
        assert response.data[8]["name"] == "Romania2012"

    def test_get_cp_report_list_country_filter(self, user, _setup_cp_report_list):
        self.client.force_authenticate(user=user)
        country = _setup_cp_report_list
        # filter by country id (country = Hungary)
        response = self.client.get(self.url, {"country_id": country.id})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert country.name in response.data[0]["name"]

    def test_get_cp_report_list_name_filter(self, user, _setup_cp_report_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"name": "man"})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["name"] == "Romania2010"

    def test_get_cp_report_list_year_filter(self, user, _setup_cp_report_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"year": 2011})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["name"] == "Bulgaria2011"
        assert response.data[0]["year"] == 2011


@pytest.fixture(name="_setup_new_cp_report")
def setup_new_cp_report(cp_report_2019, blend, substance):
    # section A
    CPRecordFactory.create(
        country_programme_report=cp_report_2019, section="A", substance=substance
    )
    # section B
    cp_rec = CPRecordFactory.create(
        country_programme_report=cp_report_2019, section="B", blend=blend
    )
    # add 3 usages for one record
    for _ in range(3):
        CPUsageFactory.create(country_programme_record=cp_rec)

    # section C (prices)
    CPPricesFactory.create(country_programme_report=cp_report_2019, blend=blend)
    CPPricesFactory.create(country_programme_report=cp_report_2019, substance=substance)

    # section D (generation)
    CPGenerationFactory.create(country_programme_report=cp_report_2019)

    # section E (emissions)
    for _ in range(2):
        CPEmission.objects.create(country_programme_report=cp_report_2019)


@pytest.fixture(name="_setup_old_cp_report")
def setup_old_cp_report(cp_report_2005, substance, blend):
    # section A
    cp_rec = CPRecordFactory.create(
        country_programme_report=cp_report_2005, section="A", substance=substance
    )
    # add 3 usages for one record
    for _ in range(3):
        CPUsageFactory.create(country_programme_record=cp_rec)

    # section C (prices)
    CPPricesFactory.create(country_programme_report=cp_report_2005, blend=blend)
    CPPricesFactory.create(country_programme_report=cp_report_2005, substance=substance)

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
            "country_programme_report": cp_report_2005,
            "row": rows[section],
            "column": columns.get(section, None),
            "value_text": f"record_{section}",
            "section": section,
        }
        if section == "D":
            record_data["value_choice"] = last_choice
        AdmRecordFactory.create(**record_data)

    return last_choice


class TestCPRecordList:
    client = APIClient()
    url = reverse("country-programme-record-list")

    def test_get_cp_record_list_annon(
        self, user, substance, blend, cp_report_2019, _setup_new_cp_report
    ):
        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 403

    def test_get_cp_record_list__invalid_cp_rep_id(
        self, user, substance, blend, cp_report_2019, _setup_new_cp_report
    ):
        self.client.force_authenticate(user=user)

        # try get cp records list without cp report id
        response = self.client.get(self.url)
        assert response.status_code == 400

        # try get cp records list with invalid cp report id
        response = self.client.get(self.url, {"cp_report_id": 999})
        assert response.status_code == 400

    def test_get_new_cp_record_list(
        self, user, substance, blend, cp_report_2019, _setup_new_cp_report
    ):
        self.client.force_authenticate(user=user)

        # get cp records list
        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 200
        assert len(response.data["section_a"]) == 1
        assert response.data["section_a"][0]["chemical_name"] == substance.name
        assert len(response.data["section_b"]) == 1
        assert response.data["section_b"][0]["chemical_name"] == blend.name
        assert len(response.data["section_b"][0]["usages"]) == 3
        assert len(response.data["section_c"]) == 2
        assert len(response.data["section_d"]) == 1
        assert response.data["section_d"][0]["chemical_name"] == "HFC-23"
        assert len(response.data["section_e"]) == 2
        assert response.data["section_f"]["remarks"] == cp_report_2019.comment

    def test_get_old_cp_record_list(self, user, cp_report_2005, _setup_old_cp_report):
        last_choice = _setup_old_cp_report
        self.client.force_authenticate(user=user)

        # check response
        response = self.client.get(self.url, {"cp_report_id": cp_report_2005.id})
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

    def test_get_cp_settings(self, user):
        url = reverse("country-programme-settings")

        # test without authentication
        response = self.client.get(url)
        assert response.status_code == 403

        self.client.force_authenticate(user=user)

        # get cp settings
        response = self.client.get(url)
        assert response.status_code == 200
