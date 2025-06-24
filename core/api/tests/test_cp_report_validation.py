import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.models.country_programme import CPReport

pytestmark = pytest.mark.django_db


def get_empty_report(country_ro):
    return {
        "country_id": country_ro.id,
        "name": "Romania2023",
        "year": 2023,
        "status": CPReport.CPReportStatus.DRAFT,
        "section_a": [],
        "section_b": [],
        "section_c": [],
        "section_d": [],
        "section_e": [],
        "section_f": {},
    }


class TestCPReportNegativeUseValues(BaseTest):
    url = reverse("country-programme-reports")

    def test_section_a_validation(self, secretariat_user, country_ro, usage, substance):
        self.client.force_authenticate(user=secretariat_user)
        report_data = get_empty_report(country_ro)
        report_data["section_a"] = [
            {
                "substance_id": substance.id,
                "blend_id": None,
                "row_id": f"substance_{substance.id}",
                "record_usages": [
                    {"usage_id": usage.id, "quantity": -1},
                ],
            },
        ]

        response = self.client.post(self.url, report_data, format="json")
        assert response.status_code == 201
        # assert response.status_code == 400
        # assert (
        #     "Negative use data"
        #     in response.data["section_a"][f"substance_{substance.id}"]["record_usages"][
        #         f"usage_{usage.id}"
        #     ]["quantity"]
        # )

    def test_section_b_validation(self, secretariat_user, country_ro, usage, blend):
        self.client.force_authenticate(user=secretariat_user)
        report_data = get_empty_report(country_ro)
        report_data["section_b"] = [
            {
                "substance_id": None,
                "blend_id": blend.id,
                "row_id": f"blend_{blend.id}",
                "record_usages": [
                    {"usage_id": usage.id, "quantity": -1},
                ],
            },
        ]

        response = self.client.post(self.url, report_data, format="json")
        assert response.status_code == 201
        # assert response.status_code == 400
        # assert (
        #     "Negative use data"
        #     in response.data["section_b"][f"blend_{blend.id}"]["record_usages"][
        #         f"usage_{usage.id}"
        #     ]["quantity"]
        # )
