import io

import openpyxl
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.base import BaseTest
from core.api.tests.conftest import pdf_text
from core.api.tests.factories import (
    AgencyFactory,
    BusinessPlanFactory,
    SubstanceFactory,
)

pytestmark = pytest.mark.django_db
# pylint: disable=C8008, W0221, R0913


class TestBPExport(BaseTest):
    url = reverse("bprecord-export")

    def test_export_anon(self, business_plan):
        response = self.client.get(
            self.url, {"business_plan__year_start": business_plan.year_start}
        )
        assert response.status_code == 403

    def test_export(self, user, business_plan, bp_record, bp_record_values):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url, {"business_plan__year_start": business_plan.year_start}
        )
        assert response.status_code == 200
        assert (
            response.filename
            == f"Business Plans {business_plan.year_start}-{business_plan.year_end}.xlsx"
        )

        wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        sheet = wb.active
        assert sheet["A2"].value == bp_record.country.name
        assert sheet["B2"].value == business_plan.agency.name
        assert sheet["M2"].value == bp_record.title

        assert sheet["O2"].value == bp_record_values[0].value_usd
        assert sheet["P2"].value == bp_record_values[0].value_odp
        assert sheet["Q2"].value == bp_record_values[0].value_mt

        assert sheet["R2"].value == bp_record_values[1].value_usd
        assert sheet["S2"].value == bp_record_values[1].value_odp
        assert sheet["T2"].value == bp_record_values[1].value_mt

        assert sheet["U2"].value == bp_record_values[2].value_usd
        assert sheet["V2"].value == bp_record_values[2].value_odp
        assert sheet["W2"].value == bp_record_values[2].value_mt

        assert sheet["X2"].value == bp_record_values[3].value_usd
        assert sheet["Y2"].value == bp_record_values[3].value_odp
        assert sheet["Z2"].value == bp_record_values[3].value_mt


class TestBPPrint(BaseTest):
    url = reverse("bprecord-print")

    def test_export_anon(self, business_plan):
        response = self.client.get(
            self.url, {"business_plan__year_start": business_plan.year_start}
        )
        assert response.status_code == 403

    def test_export(self, user, business_plan, bp_record):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url, {"business_plan__year_start": business_plan.year_start}
        )
        assert response.status_code == 200
        assert (
            response.filename
            == f"Business Plans {business_plan.year_start}-{business_plan.year_end}.pdf"
        )

        text = pdf_text(io.BytesIO(response.getvalue())).replace("\n", "")

        assert bp_record.country.name in text
        assert business_plan.agency.name in text
        assert bp_record.title in text


@pytest.fixture(name="_setup_bp_list")
def setup_bp_list(agency):
    new_agency = AgencyFactory.create(name="Agency2", code="AG2")
    for i in range(3):
        for ag, status in [(agency, "Approved"), (new_agency, "Draft")]:
            data = {
                "agency": ag,
                "year_start": 2020 + i,
                "year_end": 2022 + i,
                "status": status,
            }
            BusinessPlanFactory.create(**data)


class TestBPList(BaseTest):
    url = reverse("businessplan-list")

    def test_list_anon(self):
        response = self.client.get(self.url)
        assert response.status_code == 403

    def test_list(self, user, _setup_bp_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.json()) == 6

    def test_list_agency_filter(self, user, _setup_bp_list, agency):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"agency_id": agency.id})
        assert response.status_code == 200
        assert len(response.json()) == 3
        assert all(bp["agency"]["id"] == agency.id for bp in response.json())

    def test_list_status_filter(self, user, _setup_bp_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"status": "Draft"})
        assert response.status_code == 200
        assert len(response.json()) == 3
        assert all(bp["status"] == "Draft" for bp in response.json())

    def test_list_year_filter(self, user, _setup_bp_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"year_start": 2021})
        assert response.status_code == 200
        assert len(response.json()) == 2
        assert all(bp["year_start"] == 2021 for bp in response.json())

        response = self.client.get(self.url, {"year_end": 2023})
        assert response.status_code == 200
        assert len(response.json()) == 2
        assert all(bp["year_end"] == 2023 for bp in response.json())


@pytest.fixture(name="_setup_bp_record_create")
def setup_bp_record_create(
    business_plan,
    country_ro,
    sector,
    subsector,
    project_type,
    bp_chemical_type,
    substance,
    blend,
):
    return {
        "business_plan_id": business_plan.id,
        "title": "Planu",
        "country_id": country_ro.id,
        "lvc_status": "LVC",
        "project_type_id": project_type.id,
        "bp_chemical_type_id": bp_chemical_type.id,
        "substances": [substance.id],
        "blends": [blend.id],
        "sector_id": sector.id,
        "subsector_id": subsector.id,
        "bp_type": "A",
        "is_multi_year": False,
        "reason_for_exceeding": "Planu, planu, planu, planu, planu",
        "remarks": "Merge bine, bine, bine ca aeroplanu",
        "remarks_additional": "Poate si la anu / Daca merge bine planu stau ca barosanu.",
        "values": [
            {
                "year": 2020,
                "value_usd": 100,
                "value_odp": 100,
                "value_mt": 100,
            },
            {
                "year": 2021,
                "value_usd": 200,
                "value_odp": 200,
                "value_mt": 200,
            },
        ],
    }


class TestBPRecordCreate:
    client = APIClient()
    url = reverse("bprecord-list")

    def test_create_anon(self, _setup_bp_record_create):
        response = self.client.post(self.url, _setup_bp_record_create, format="json")
        assert response.status_code == 403

    def test_create_record(
        self,
        user,
        _setup_bp_record_create,
        business_plan,
        country_ro,
        substance,
        blend,
        sector,
        subsector,
        project_type,
        bp_chemical_type,
    ):
        self.client.force_authenticate(user=user)
        response = self.client.post(self.url, _setup_bp_record_create, format="json")

        assert response.status_code == 201
        assert response.data["business_plan_id"] == business_plan.id
        assert response.data["title"] == "Planu"
        assert response.data["country_id"] == country_ro.id
        assert response.data["lvc_status"] == "LVC"
        assert response.data["project_type_id"] == project_type.id
        assert response.data["bp_chemical_type_id"] == bp_chemical_type.id
        assert response.data["substances"] == [substance.id]
        assert response.data["blends"] == [blend.id]
        assert response.data["sector_id"] == sector.id
        assert response.data["subsector_id"] == subsector.id
        assert response.data["bp_type"] == "A"
        assert response.data["is_multi_year"] is False
        assert (
            response.data["reason_for_exceeding"] == "Planu, planu, planu, planu, planu"
        )
        assert response.data["remarks"] == "Merge bine, bine, bine ca aeroplanu"
        assert (
            response.data["remarks_additional"]
            == "Poate si la anu / Daca merge bine planu stau ca barosanu."
        )
        assert response.data["values"][0]["year"] == 2020
        assert response.data["values"][1]["year"] == 2021


class TestBPRecordUpdate:
    client = APIClient()

    def test_update_record(
        self,
        user,
        _setup_bp_record_create,
        business_plan,
        substance,
    ):
        self.client.force_authenticate(user=user)

        url = reverse("bprecord-list")
        response = self.client.post(url, _setup_bp_record_create, format="json")
        assert response.status_code == 201
        bp_record_id = response.data["id"]

        url = reverse("bprecord-list") + f"{bp_record_id}/"
        data = _setup_bp_record_create
        substance2 = SubstanceFactory.create(name="substance2")
        data["substances"] = [substance.id, substance2.id]
        data["blends"] = []
        data["title"] = "Planu 2"
        data["bp_type"] = "P"
        data["is_multi_year"] = True
        data["remarks"] = "Merge rau"
        data["values"] = [
            {
                "year": 2022,
                "value_usd": 300,
                "value_odp": 300,
                "value_mt": 300,
            }
        ]
        response = self.client.put(url, data, format="json")

        assert response.status_code == 200
        assert response.data["business_plan_id"] == business_plan.id
        assert response.data["title"] == "Planu 2"
        assert response.data["substances"] == [substance.id, substance2.id]
        assert response.data["blends"] == []
        assert response.data["bp_type"] == "P"
        assert response.data["is_multi_year"] is True
        assert response.data["remarks"] == "Merge rau"
        assert response.data["values"][0]["year"] == 2022
