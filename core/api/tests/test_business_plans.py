import io

import openpyxl
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from unittest.mock import patch

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
    SubstanceFactory,
)

pytestmark = pytest.mark.django_db
# pylint: disable=C8008, W0221, W0613, R0913


@pytest.fixture(name="mock_send_mail_bp_create")
def _mock_send_mail_bp_create():
    with patch("core.tasks.send_mail_bp_create.delay") as send_mail:
        yield send_mail


@pytest.fixture(name="mock_send_mail_bp_update")
def _mock_send_mail_bp_update():
    with patch("core.tasks.send_mail_bp_update.delay") as send_mail:
        yield send_mail


@pytest.fixture(name="mock_send_mail_bp_status_update")
def _mock_send_mail_bp_status_update():
    with patch("core.tasks.send_mail_bp_status_update.delay") as send_mail:
        yield send_mail


class TestBPExport(BaseTest):
    url = reverse("bprecord-export")

    def test_export_anon(self, business_plan):
        response = self.client.get(self.url, {"business_plan_id": business_plan.id})
        assert response.status_code == 403

    def test_export(self, user, business_plan, bp_record, bp_record_values):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"business_plan_id": business_plan.id})
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
        response = self.client.get(self.url, {"business_plan_id": business_plan.id})
        assert response.status_code == 403

    def test_export(self, user, business_plan, bp_record, bp_record_values):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"business_plan_id": business_plan.id})
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
        "status": "A",
        "is_multi_year": False,
        "reason_for_exceeding": "Planu, planu, planu, planu, planu",
        "remarks": "Merge bine, bine, bine ca aeroplanu",
        "remarks_additional": "Poate si la anu / Daca merge bine planu stau ca barosanu.",
        "comment_agency": "Alo, alo",
        "comment_secretariat": "Te-am sunat sa-ti spun",
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

    def test_create_wrong_record_values(self, user, _setup_bp_record_create):
        self.client.force_authenticate(user=user)
        data = _setup_bp_record_create
        data["values"] = [
            {
                "year": 2025,  # wrong year
                "value_usd": 100,
                "value_odp": 100,
                "value_mt": 100,
            }
        ]
        response = self.client.post(self.url, _setup_bp_record_create, format="json")

        assert response.status_code == 400
        assert (
            response.data["general_error"]
            == "BP record values year not in business plan interval"
        )

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
        assert response.data["status"] == "A"
        assert response.data["is_multi_year"] is False
        assert (
            response.data["reason_for_exceeding"] == "Planu, planu, planu, planu, planu"
        )
        assert response.data["remarks"] == "Merge bine, bine, bine ca aeroplanu"
        assert (
            response.data["remarks_additional"]
            == "Poate si la anu / Daca merge bine planu stau ca barosanu."
        )
        assert response.data["comment_agency"] == "Alo, alo"
        assert response.data["comment_secretariat"] == "Te-am sunat sa-ti spun"
        assert response.data["values"][0]["year"] == 2020
        assert response.data["values"][1]["year"] == 2021


class TestBPRecordUpdate:
    client = APIClient()

    def test_update_wrong_record_values(self, user, _setup_bp_record_create):
        self.client.force_authenticate(user=user)

        url = reverse("bprecord-list")
        response = self.client.post(url, _setup_bp_record_create, format="json")
        assert response.status_code == 201
        bp_record_id = response.data["id"]

        url = reverse("bprecord-list") + f"{bp_record_id}/"
        data = _setup_bp_record_create
        data["values"] = [
            {
                "year": 2025,  # wrong year
                "value_usd": 100,
                "value_odp": 100,
                "value_mt": 100,
            }
        ]
        response = self.client.put(url, data, format="json")

        assert response.status_code == 400
        assert (
            response.data["general_error"]
            == "BP record values year not in business plan interval"
        )

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
        data["status"] = "P"
        data["is_multi_year"] = True
        data["remarks"] = "Merge rau"
        data["comment_agency"] = "Nu inchide telefonu"
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
        assert response.data["status"] == "P"
        assert response.data["is_multi_year"] is True
        assert response.data["remarks"] == "Merge rau"
        assert response.data["comment_agency"] == "Nu inchide telefonu"
        assert response.data["values"][0]["year"] == 2022


@pytest.fixture(name="_setup_new_business_plan_create")
def setup_new_business_plan_create(agency):
    return {
        "agency_id": agency.id,
        "year_start": 2020,
        "year_end": 2022,
        "status": "Submitted",
    }


class TestBPCreate:
    client = APIClient()

    def test_without_login(self, _setup_new_business_plan_create):
        url = reverse("businessplan-list")
        response = self.client.post(url, _setup_new_business_plan_create, format="json")
        assert response.status_code == 403

    def test_create_business_plan(
        self, user, agency, _setup_new_business_plan_create, mock_send_mail_bp_create
    ):
        # create new business plan
        self.client.force_authenticate(user=user)
        url = reverse("businessplan-list")
        response = self.client.post(url, _setup_new_business_plan_create, format="json")

        assert response.status_code == 201
        assert response.data["status"] == "Submitted"
        assert response.data["year_start"] == 2020
        assert response.data["year_end"] == 2022
        assert response.data["agency_id"] == agency.id

        mock_send_mail_bp_create.assert_called_once()


class TestBPStatusUpdate:
    client = APIClient()

    def test_without_login(self, business_plan):
        url = reverse("business-plan-status", kwargs={"id": business_plan.id})
        response = self.client.put(url, {"status": "Approved"})
        assert response.status_code == 403

    def test_invalid_status(self, user, business_plan):
        self.client.force_authenticate(user=user)
        url = reverse("business-plan-status", kwargs={"id": business_plan.id})
        response = self.client.put(url, {"status": "Draft"})

        assert response.status_code == 400
        assert "Invalid value" in response.data["status"]

    def test_update_status(self, user, business_plan, mock_send_mail_bp_status_update):
        self.client.force_authenticate(user=user)
        url = reverse("business-plan-status", kwargs={"id": business_plan.id})
        response = self.client.put(url, {"status": "Approved"})

        assert response.status_code == 200
        assert response.data["status"] == "Approved"
        assert response.data["id"] == business_plan.id

        mock_send_mail_bp_status_update.assert_called_once()


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
                "status": "A",
                "is_multi_year": i % 2 == 0,
                "reason_for_exceeding": f"Planu, planu, planu, planu, planu{i}",
                "remarks": f"Merge bine, bine, bine ca aeroplanu{i}",
                "remarks_additional": f"Poate si la anu / Daca merge bine planu stau ca barosanu.{i}",
                "comment_agency": f"Alo, alo{i}",
                "comment_secretariat": f"Te-am sunat sa-ti spun{i}",
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
        assert len(response.json()["records"]) == 4

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
        assert len(response.json()["records"]) == 4

    def test_country_filter(
        self, user, business_plan, country_ro, _setup_bp_record_list
    ):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "country_id": country_ro.id},
        )
        assert response.status_code == 200
        assert len(response.json()["records"]) == 1
        assert response.json()["records"][0]["country"]["id"] == country_ro.id

    def test_invalid_country_filter(self, user, _setup_bp_record_list, business_plan):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "country_id": 999},
        )
        assert response.status_code == 400

    def test_status_filter(self, user, business_plan, _setup_bp_record_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "status": "A"},
        )
        assert response.status_code == 200
        assert len(response.json()["records"]) == 4

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "status": "U"},
        )
        assert response.status_code == 200
        assert len(response.json()["records"]) == 0

    def test_search_filter(self, user, business_plan, _setup_bp_record_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "search": "Planu2"},
        )
        assert response.status_code == 200
        assert len(response.json()["records"]) == 1
        assert response.json()["records"][0]["title"] == "Planu2"

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


class TestBPUpdate:
    client = APIClient()

    def test_without_login(self, _setup_bp_record_create, business_plan):
        url = reverse("businessplan-list") + f"{business_plan.id}/"
        data = {
            "agency_id": business_plan.agency_id,
            "year_start": business_plan.year_start,
            "year_end": business_plan.year_end,
            "status": "Submitted",
            "records": [_setup_bp_record_create],
        }
        response = self.client.put(url, data, format="json")
        assert response.status_code == 403

    def test_update_wrong_record_values(
        self, user, _setup_bp_record_create, business_plan
    ):
        self.client.force_authenticate(user=user)

        url = reverse("businessplan-list") + f"{business_plan.id}/"
        record_data = _setup_bp_record_create
        record_data["values"] = [
            {
                "year": 2025,  # wrong year
                "value_usd": 100,
                "value_odp": 100,
                "value_mt": 100,
            }
        ]
        data = {
            "agency_id": business_plan.agency_id,
            "year_start": business_plan.year_start,
            "year_end": business_plan.year_end,
            "status": "Submitted",
            "records": [record_data],
        }
        response = self.client.put(url, data, format="json")

        assert response.status_code == 400
        assert (
            response.data["general_error"]
            == "BP record values year not in business plan interval"
        )

    def test_bp_update(
        self,
        user,
        _setup_bp_record_create,
        business_plan,
        substance,
        mock_send_mail_bp_update,
    ):
        self.client.force_authenticate(user=user)

        url = reverse("businessplan-list") + f"{business_plan.id}/"
        record_data = _setup_bp_record_create
        substance2 = SubstanceFactory.create(name="substance2")
        record_data["substances"] = [substance.id, substance2.id]
        record_data["blends"] = []
        record_data["title"] = "Planu 2"
        record_data["status"] = "P"
        record_data["is_multi_year"] = True
        record_data["remarks"] = "Merge rau"
        record_data["comment_agency"] = "Nu inchide telefonu"
        record_data["values"] = [
            {
                "year": 2022,
                "value_usd": 300,
                "value_odp": 300,
                "value_mt": 300,
            }
        ]
        data = {
            "agency_id": business_plan.agency_id,
            "year_start": business_plan.year_start,
            "year_end": business_plan.year_end,
            "status": "Submitted",
            "records": [record_data],
        }
        response = self.client.put(url, data, format="json")

        assert response.status_code == 200
        records = response.data["records"]
        assert records[0]["business_plan_id"] == response.data["id"]
        assert records[0]["title"] == "Planu 2"
        assert records[0]["substances"] == [substance.id, substance2.id]
        assert records[0]["blends"] == []
        assert records[0]["status"] == "P"
        assert records[0]["is_multi_year"] is True
        assert records[0]["remarks"] == "Merge rau"
        assert records[0]["comment_agency"] == "Nu inchide telefonu"
        assert records[0]["values"][0]["year"] == 2022

        mock_send_mail_bp_update.assert_called_once()
