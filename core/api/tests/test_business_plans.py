import io

import openpyxl
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.base import BaseTest
from core.api.tests.conftest import pdf_text
from core.api.tests.factories import (
    AgencyFactory,
    BPRecordFactory,
    BPRecordValueFactory,
    BusinessPlanFactory,
    CountryFactory,
    ProjectClusterFactory,
    ProjectSectorFactory,
    ProjectSubSectorFactory,
    ProjectTypeFactory,
)

pytestmark = pytest.mark.django_db
# pylint: disable=C8008, W0221


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


@pytest.fixture(name="_setup_bp_record_list")
def setup_bp_record_list(
    business_plan,
    country_ro,
    sector,
    subsector,
    project_type,
    bp_chemical_type,
    substance,
    blend,
    project_cluster_kpp,
):
    countries = [country_ro]
    subsectors = [subsector]
    project_types = [project_type]
    clusters = [project_cluster_kpp]
    another_bp = BusinessPlanFactory.create(
        agency=business_plan.agency,
        year_start=business_plan.year_start - 1,
        year_end=business_plan.year_end - 1,
    )
    for i in range(3):
        countries.append(CountryFactory.create(name=f"Country{i}", iso3=f"CO{i}"))
        sector = ProjectSectorFactory.create(name=f"Sector{i}")
        subsector = ProjectSubSectorFactory.create(name=f"Subsector{i}", sector=sector)
        subsectors.append(subsector)
        project_types.append(ProjectTypeFactory.create(name=f"Type{i}"))
        clusters.append(ProjectClusterFactory.create(name=f"Cluster{i}", code=f"CL{i}"))

    for bp in [business_plan, another_bp]:
        for i in range(4):
            data = {
                "business_plan": bp,
                "title": f"Planu{i}",
                "country": countries[i],
                "lvc_status": "LVC",
                "project_cluster": clusters[i],
                "project_type": project_types[i],
                "bp_chemical_type": bp_chemical_type,
                "sector": subsectors[i].sector,
                "subsector": subsectors[i],
                "bp_type": "Approved",
                "is_multi_year": i % 2 == 0,
                "reason_for_exceeding": f"Planu, planu, planu, planu, planu{i}",
                "remarks": f"Merge bine, bine, bine ca aeroplanu{i}",
                "remarks_additional": f"Poate si la anu / Daca merge bine planu stau ca barosanu.{i}",
            }
            bp_record = BPRecordFactory.create(**data)
            bp_record.substances.set([substance])
            bp_record.blends.set([blend])
            for i in range(business_plan.year_start, business_plan.year_end + 1):
                BPRecordValueFactory.create(
                    bp_record=bp_record, value_usd=i, value_odp=i, value_mt=i
                )


class TestBPRecordList:
    client = APIClient()
    url = reverse("bprecord-list")

    def test_list_anon(self, business_plan):
        response = self.client.get(self.url, {"business_plan_id": business_plan.id})
        assert response.status_code == 403

    def test_record_list(self, user, _setup_bp_record_list, business_plan):
        self.client.force_authenticate(user=user)

        # get by id
        response = self.client.get(self.url, {"business_plan_id": business_plan.id})
        assert response.status_code == 200
        assert len(response.json()) == 4

        # get by agency, start_year, end_year
        response = self.client.get(
            self.url,
            {
                "agency_id": business_plan.agency_id,
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 4

    def test_country_filter(
        self, user, business_plan, country_ro, _setup_bp_record_list
    ):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "country_id": country_ro.id},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["country"]["id"] == country_ro.id

    def test_invalid_country_filter(self, user, _setup_bp_record_list, business_plan):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "country_id": 999},
        )
        assert response.status_code == 400

    def test_search_filter(self, user, business_plan, _setup_bp_record_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "search": "Planu2"},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["title"] == "Planu2"

    def test_invalid_bp_id(self, user, _setup_bp_record_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {"business_plan_id": 999},
        )
        assert response.status_code == 400

    def test_invalid_year(self, user, _setup_bp_record_list, agency):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {
                "agency_id": agency.id,
                "year_start": 99,
                "year_end": 999,
            },
        )
        assert response.status_code == 400

    def test_invalid_agency(self, user, _setup_bp_record_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {
                "agency_id": 999,
                "year_start": 2021,
                "year_end": 2023,
            },
        )
        assert response.status_code == 400
