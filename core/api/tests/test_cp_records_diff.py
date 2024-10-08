import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.models.country_programme import CPReport

pytestmark = pytest.mark.django_db


@pytest.fixture(name="_setup_new_cp_report_create")
def setup_new_cp_report_create(country_ro):
    return {
        "country_id": country_ro.id,
        "name": "Romania2023",
        "year": 2023,
        "status": CPReport.CPReportStatus.FINAL,
        "section_a": [],
        "section_b": [],
        "section_c": [],
        "section_d": [],
        "section_e": [],
        "section_f": {},
    }


class TestCPRecordsDiff:
    client = APIClient()

    def test_section_a_b_diff(
        self, user, _setup_new_cp_report_create, substance, blend, usage
    ):
        self.client.force_authenticate(user=user)
        # create report with sections A and B
        url = reverse("country-programme-reports")
        data = _setup_new_cp_report_create
        data["section_a"] = [
            {
                "substance_id": substance.id,
                "blend_id": None,
                "row_id": f"substance_{substance.id}",
                "imports": 100,
                "record_usages": [
                    {"usage_id": usage.id, "quantity": 100},
                ],
            },
            {
                "substance_id": None,
                "blend_id": blend.id,
                "row_id": f"blend_{blend.id}",
                "exports": 100,
                "record_usages": [
                    {"usage_id": usage.id, "quantity": 100},
                ],
            },
        ]
        data["section_b"] = data["section_a"]
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        cp_report_id = response.data["id"]

        # update report - change substance, delete blend
        url = reverse("country-programme-reports") + f"{cp_report_id}/"
        data = _setup_new_cp_report_create
        data["section_a"] = [
            {
                "substance_id": substance.id,
                "blend_id": None,
                "row_id": f"substance_{substance.id}",
                "imports": 200,
                "banned_date": "2019-11-21",
                "record_usages": [
                    {"usage_id": usage.id, "quantity": 200},
                ],
            },
        ]
        data["section_b"] = data["section_a"]
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data["id"]

        # check records diff
        url = reverse("country-programme-record-diff")
        response = self.client.get(url, {"cp_report_id": new_id})
        assert response.status_code == 200

        for section in ("section_a", "section_b"):
            # check substance/usage diff
            assert response.data[section][0]["change_type"] == "changed"
            assert float(response.data[section][0]["imports"]) == 200
            assert float(response.data[section][0]["imports_old"]) == 100
            assert response.data[section][0]["banned_date"] == "2019-11-21"
            assert response.data[section][0]["banned_date_old"] is None
            assert (
                float(response.data[section][0]["record_usages"][0]["quantity"]) == 200
            )
            assert (
                float(response.data[section][0]["record_usages"][0]["quantity_old"])
                == 100
            )

            # check blend/usage diff
            assert response.data[section][1]["change_type"] == "deleted"
            assert response.data[section][1]["exports"] is None
            assert float(response.data[section][1]["exports_old"]) == 100
            assert response.data[section][1]["record_usages"][0]["quantity"] is None
            assert (
                float(response.data[section][1]["record_usages"][0]["quantity_old"])
                == 100
            )

    def test_section_c_diff(self, user, _setup_new_cp_report_create, substance, blend):
        self.client.force_authenticate(user=user)
        # create report with section C
        url = reverse("country-programme-reports")
        data = _setup_new_cp_report_create
        data["section_c"] = [
            {
                "substance_id": substance.id,
                "blend_id": None,
                "row_id": f"substance_{substance.id}",
                "current_year_price": 100,
            },
            {
                "substance_id": None,
                "blend_id": blend.id,
                "row_id": f"blend_{blend.id}",
                "previous_year_price": 100,
                "current_year_price": 100,
            },
        ]
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        cp_report_id = response.data["id"]

        # update report - change substance, delete blend
        url = reverse("country-programme-reports") + f"{cp_report_id}/"
        data = _setup_new_cp_report_create
        data["section_c"] = [
            {
                "substance_id": substance.id,
                "blend_id": None,
                "row_id": f"substance_{substance.id}",
                "current_year_price": 200,
            },
        ]
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data["id"]

        # check records diff
        url = reverse("country-programme-record-diff")
        response = self.client.get(url, {"cp_report_id": new_id})
        assert response.status_code == 200

        # check substance diff
        assert response.data["section_c"][0]["change_type"] == "changed"
        assert float(response.data["section_c"][0]["current_year_price"]) == 200
        assert float(response.data["section_c"][0]["current_year_price_old"]) == 100

        # check blend diff
        assert response.data["section_c"][1]["change_type"] == "deleted"
        assert response.data["section_c"][1]["previous_year_price"] is None
        assert float(response.data["section_c"][1]["previous_year_price_old"]) == 100

    def test_section_d_diff(self, user, _setup_new_cp_report_create):
        self.client.force_authenticate(user=user)
        # create report with empty section D
        url = reverse("country-programme-reports")
        data = _setup_new_cp_report_create
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        cp_report_id = response.data["id"]

        # update report - section D
        url = reverse("country-programme-reports") + f"{cp_report_id}/"
        data = _setup_new_cp_report_create
        data["section_d"] = [
            {
                "row_id": "generation_1",
                "all_uses": "200",
            }
        ]
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data["id"]

        # check records diff
        url = reverse("country-programme-record-diff")
        response = self.client.get(url, {"cp_report_id": new_id})
        assert response.status_code == 200

        assert response.data["section_d"][0]["change_type"] == "new"
        assert float(response.data["section_d"][0]["all_uses"]) == 200
        assert response.data["section_d"][0]["all_uses_old"] is None

    def test_section_e_diff(self, user, _setup_new_cp_report_create):
        self.client.force_authenticate(user=user)
        # create report with section E
        url = reverse("country-programme-reports")
        data = _setup_new_cp_report_create
        data["section_e"] = [
            {
                "facility": "Facility",
                "all_uses": 100,
            },
        ]
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        cp_report_id = response.data["id"]

        # update report - change existing facility, add new facility
        url = reverse("country-programme-reports") + f"{cp_report_id}/"
        data = _setup_new_cp_report_create
        data["section_e"] = [
            {
                "facility": "Facility",
                "all_uses": 200,
            },
            {
                "facility": "Facility new",
                "total": 200,
            },
        ]
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data["id"]

        # check records diff
        url = reverse("country-programme-record-diff")
        response = self.client.get(url, {"cp_report_id": new_id})
        assert response.status_code == 200

        assert response.data["section_e"][0]["change_type"] == "changed"
        assert float(response.data["section_e"][0]["all_uses"]) == 200
        assert float(response.data["section_e"][0]["all_uses_old"]) == 100

        assert response.data["section_e"][1]["change_type"] == "new"
        assert float(response.data["section_e"][1]["total"]) == 200
        assert response.data["section_e"][1]["total_old"] is None
