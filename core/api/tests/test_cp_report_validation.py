import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import GroupFactory, SubstanceFactory
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


class TestCPReportValidation(BaseTest):
    url = reverse("country-programme-reports")

    def test_section_c_validation(self, user, country_ro, substance):
        self.client.force_authenticate(user=user)
        groupB = GroupFactory.create(name="group B", annex="B")
        substance2 = SubstanceFactory.create(name="substance2", group=groupB)
        report_data = get_empty_report(country_ro)
        report_data["section_c"] = [
            {
                "substance_id": substance.id,
                "blend_id": None,
                "row_id": f"substance_{substance.id}",
                "current_year_price": 10,
                "remarks": "",
            },
            {
                "substance_id": substance2.id,
                "blend_id": None,
                "row_id": f"substance_{substance2.id}",
                "current_year_price": 20.5,
                "remarks": "Retail price",
            },
        ]

        response = self.client.post(self.url, report_data, format="json")
        assert response.status_code == 400
        # Must indicate whether the prices are FOB or retail prices
        assert "remarks" in response.data["section_c"][f"substance_{substance.id}"]

    def test_section_d_validation(self, user, country_ro):
        self.client.force_authenticate(user=user)
        report_data = get_empty_report(country_ro)
        report_data["section_d"] = [
            {
                "row_id": "generation_1",
                "all_uses": 5,
                "feedstock_gc": 5,
                "destruction": 5,
            },
        ]
        report_data["section_e"] = [
            {
                "row_id": "emission_1",
                "facility": "Facility",
                "all_uses": 10,
                "feedstock_gc": 5,
                "destruction": 10,
            },
        ]

        response = self.client.post(self.url, report_data, format="json")
        assert response.status_code == 400
        # This form should be filled only if the country produced
        # HCFC (Annex C – Group I) or HFC (Annex F) substances
        assert "general_error" in response.data["section_d"]

        groupCI = GroupFactory.create(name="C/I", annex="CI")
        substance = SubstanceFactory.create(name="HCFC", group=groupCI)
        report_data["section_a"] = [
            {
                "row_id": f"substance_{substance.id}",
                "substance_id": substance.id,
                "blend_id": None,
                "imports": 0,
                "exports": 0,
                "production": 20,
                "remarks": "Limita-i la cer",
                "record_usages": [],
            },
        ]
        response = self.client.post(self.url, report_data, format="json")
        assert response.status_code == 400
        # Total for columns under 'Amount generated and captured' in Section E
        # should be reported in Section D under the respective column
        assert "all_uses" in response.data["section_d"]["generation_1"]
        assert "destruction" in response.data["section_d"]["generation_1"]

    def test_section_e_validation(self, user, country_ro):
        self.client.force_authenticate(user=user)
        report_data = get_empty_report(country_ro)
        report_data["section_d"] = [
            {
                "row_id": "generation_1",
                "all_uses": 5,
                "feedstock_gc": 5,
                "destruction": 5,
            },
        ]

        response = self.client.post(self.url, report_data, format="json")
        assert response.status_code == 400
        # Facility name must be provided if data in Section D is provided
        assert "general_error" in response.data["section_e"]
