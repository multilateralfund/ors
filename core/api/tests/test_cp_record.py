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
        assert len(response.data["section_a"]) == 1
        assert len(response.data["section_a"][0]["excluded_usages"]) == 1
        assert response.data["section_a"][0]["chemical_name"] == substance.name
        assert response.data["section_a"][0]["rowId"] == f"substance_{substance.id}"
        assert len(response.data["section_b"]) == 2
        assert response.data["section_b"][0]["chemical_name"] == blend.name
        assert response.data["section_b"][0]["rowId"] == f"blend_{blend.id}"
        assert len(response.data["section_b"][0]["record_usages"]) == 3
        assert len(response.data["section_c"]) == 3
        assert len(response.data["section_d"]) == 1
        assert response.data["section_d"][0]["chemical_name"] == "HFC-23"
        assert response.data["section_d"][0]["rowId"] == "generation_1"
        assert len(response.data["section_e"]) == 2
        emission = response.data["section_e"][0]
        assert response.data["section_e"][0]["rowId"] == f"facility_{emission['id']}"
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
            response.data["adm_d"][0]["values"][0]["value_choice_id"] == last_choice.id
        )
