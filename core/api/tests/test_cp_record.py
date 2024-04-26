from math import isclose
import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest

pytestmark = pytest.mark.django_db
# pylint: disable=C8008, W0221


class TestCPRecordList(BaseTest):
    url = reverse("country-programme-record-list")

    def test_without_login(self, cp_report_2019, _setup_new_cp_report):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 403

    def test_get_cp_record_list__invalid_cp_rep_id(self, user, _setup_new_cp_report):
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
        assert len(response.data["section_a"]) == 4
        record = response.data["section_a"][0]
        assert len(record["excluded_usages"]) == 1
        assert record["chemical_name"] == substance.name
        assert record["imports_gwp"] == 0
        assert record["imports_odp"] == 0
        assert isclose(record["exports_gwp"], float(record["exports"]) * substance.gwp)
        assert isclose(record["exports_odp"], float(record["exports"]) * substance.odp)
        assert record["row_id"] == f"substance_{substance.id}"
        assert response.data["section_a"][3]["group"] == "group B B"

        assert len(response.data["section_b"]) == 8
        assert response.data["section_b"][0]["id"] == 0  # no records for this substance
        assert (
            response.data["section_b"][1]["id"] != 0
        )  # there is a record for this substance
        assert response.data["section_b"][2]["chemical_name"] == blend.name
        assert response.data["section_b"][2]["row_id"] == f"blend_{blend.id}"
        assert len(response.data["section_b"][2]["record_usages"]) == 3
        record_us = response.data["section_b"][2]["record_usages"][0]
        assert record_us["quantity"] != 0
        assert isclose(
            record_us["quantity_gwp"], float(record_us["quantity"]) * blend.gwp
        )
        assert isclose(
            record_us["quantity_odp"], float(record_us["quantity"]) * blend.odp
        )
        assert response.data["section_b"][3]["id"] == 0
        assert response.data["section_b"][-3]["id"] != 0
        assert response.data["section_b"][-3]["chemical_name"] == "AddedByUser"
        assert response.data["section_b"][-2]["id"] == 0
        assert "substance" in response.data["section_b"][-2]["row_id"]
        assert response.data["section_b"][-1]["id"] != 0
        assert "substance" in response.data["section_b"][-1]["row_id"]

        section_c = response.data["section_c"]
        assert len(section_c) == 12
        assert section_c[0]["chemical_name"] == substance.name
        assert section_c[0]["group"] == "HCFCs"
        assert section_c[0]["computed_prev_year_price"] is None
        assert int(float(section_c[0]["current_year_price"])) == 2019

        # chemical displayed without prices
        assert section_c[1]["computed_prev_year_price"] is None
        assert section_c[1]["current_year_price"] is None

        assert section_c[6]["chemical_name"] == blend.name
        assert int(section_c[6]["computed_prev_year_price"]) == 2018
        assert int(float(section_c[6]["current_year_price"])) == 2019

        assert response.data["section_d"][0]["chemical_name"] == "HFC-23"
        assert response.data["section_d"][0]["row_id"] == "generation_1"

        assert len(response.data["section_e"]) == 2
        emission = response.data["section_e"][0]
        assert response.data["section_e"][0]["row_id"] == f"facility_{emission['id']}"

        assert response.data["section_f"]["remarks"] == cp_report_2019.comment

    def test_get_old_cp_record_list(self, user, cp_report_2005, _setup_old_cp_report):
        last_choice = _setup_old_cp_report
        self.client.force_authenticate(user=user)

        # check response
        response = self.client.get(self.url, {"cp_report_id": cp_report_2005.id})
        assert response.status_code == 200
        assert len(response.data["section_a"]) == 2
        assert len(response.data["adm_b"]) == 1
        assert response.data["adm_b"][0]["row_text"] == "rowB"
        assert response.data["adm_b"][0]["values"][0]["value_text"] == "record_B"
        assert len(response.data["section_c"]) == 2
        assert len(response.data["adm_c"]) == 1
        assert len(response.data["adm_d"]) == 1
        assert (
            response.data["adm_d"][last_choice.adm_row_id]["value_choice_id"]
            == last_choice.id
        )

    def test_get_96_records_list(
        self, user, _setup_96_cp_report, cp_report_1996, substance
    ):
        self.client.force_authenticate(user=user)
        response = self.client.get(self.url, {"cp_report_id": cp_report_1996.id})
        assert response.status_code == 200
        assert len(response.data) == 2  # section_a, country program report
        assert len(response.data["section_a"]) == 1
        assert len(response.data["section_a"][0]["excluded_usages"]) == 1
        assert response.data["section_a"][0]["chemical_name"] == substance.name
        assert response.data["section_a"][0]["row_id"] == f"substance_{substance.id}"

    def get_by_country_and_year(self, user, cp_report_2019, _setup_new_cp_report):
        self.client.force_authenticate(user=user)

        # get cp records list
        response = self.client.get(
            self.url,
            {"country_id": cp_report_2019.country_id, "year": cp_report_2019.year},
        )
        assert response.status_code == 200
        assert response.data["cp_report"]["id"] == cp_report_2019.id
        assert len(response.data["section_a"]) == 4
        assert len(response.data["section_b"]) == 7
        assert len(response.data["section_c"]) == 11
        assert len(response.data["section_d"]) == 1
        assert len(response.data["section_e"]) == 2
        assert len(response.data["section_f"]["remarks"]) == cp_report_2019.comment
