from datetime import datetime

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    BPActivityFactory,
    BPActivityValueFactory,
    BPChemicalTypeFactory,
    BusinessPlanFactory,
    CountryFactory,
    ProjectClusterFactory,
    ProjectSectorFactory,
    ProjectSubSectorFactory,
    ProjectTypeFactory,
    SubstanceFactory,
)
from core.models.business_plan import BusinessPlan

pytestmark = pytest.mark.django_db
# pylint: disable=C8008, W0221, W0613, R0913, C0302, R0914, R0915


class TestBPChemicalTypeList(BaseTest):
    url = reverse("bp-chemical-type-list")

    def test_bp_chemical_type_list(self, user, bp_chemical_type):
        self.client.force_authenticate(user=user)

        # get all BP chemical types
        other_bp_chemical_type = BPChemicalTypeFactory()
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data == [
            {
                "id": bp_chemical_type.id,
                "name": bp_chemical_type.name,
            },
            {
                "id": other_bp_chemical_type.id,
                "name": other_bp_chemical_type.name,
            },
        ]

        # filter by name
        response = self.client.get(self.url, {"name": bp_chemical_type.name})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data == [
            {
                "id": bp_chemical_type.id,
                "name": bp_chemical_type.name,
            }
        ]


@pytest.fixture(name="_setup_bp_list")
def setup_bp_list():
    start_year = datetime.now().year - 2
    for year in range(start_year, start_year + 3):
        for status in ["Submitted", "Endorsed"]:
            data = {
                "year_start": year,
                "year_end": year + 2,
                "status": status,
            }
            BusinessPlanFactory.create(**data)


class TestBPList(BaseTest):
    url = reverse("businessplan-list")

    def test_list_permissions(
        self,
        secretariat_user,
        agency_user,
        agency_inputter_user,
        bp_viewer_user,
        bp_editor_user,
        admin_user,
    ):
        def _test_permissions(user, expected_status):
            self.client.force_authenticate(user=user)
            response = self.client.get(self.url)
            assert response.status_code == expected_status

        # check anon permissions
        _test_permissions(None, 403)

        _test_permissions(secretariat_user, 200)
        _test_permissions(agency_user, 200)
        _test_permissions(agency_inputter_user, 200)

        _test_permissions(bp_viewer_user, 200)
        _test_permissions(bp_editor_user, 200)
        _test_permissions(admin_user, 200)

    def test_list(self, bp_viewer_user, _setup_bp_list):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.json()) == 6

    def test_list_status_filter(self, bp_viewer_user, _setup_bp_list):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(self.url, {"status": "Endorsed"})
        assert response.status_code == 200
        assert len(response.json()) == 3
        assert all(bp["status"] == "Endorsed" for bp in response.json())

    def test_list_year_filter(self, bp_viewer_user, _setup_bp_list):
        self.client.force_authenticate(user=bp_viewer_user)
        current_year = datetime.now().year
        response = self.client.get(self.url, {"year_start": current_year})
        assert response.status_code == 200
        assert len(response.json()) == 2
        assert all(bp["year_start"] == current_year for bp in response.json())

        response = self.client.get(self.url, {"year_end": current_year + 2})
        assert response.status_code == 200
        assert len(response.json()) == 2
        assert all(bp["year_end"] == current_year + 2 for bp in response.json())


class TestBPYearList(BaseTest):
    url = reverse("businessplan-get-years")

    def test_list_permissions(
        self,
        secretariat_user,
        agency_user,
        agency_inputter_user,
        bp_viewer_user,
        bp_editor_user,
        admin_user,
    ):
        def _test_permissions(user, expected_status):
            self.client.force_authenticate(user=user)
            response = self.client.get(self.url)
            assert response.status_code == expected_status

        # check anon permissions
        _test_permissions(None, 403)

        _test_permissions(bp_viewer_user, 200)
        _test_permissions(bp_editor_user, 200)
        _test_permissions(secretariat_user, 200)
        _test_permissions(agency_user, 200)
        _test_permissions(agency_inputter_user, 200)
        _test_permissions(admin_user, 200)

    def test_list(self, bp_editor_user, _setup_bp_list):
        self.client.force_authenticate(user=bp_editor_user)

        current_year = datetime.now().year

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.json()) == (current_year - 2013) + 1
        assert response.json()[1] == {
            "year_start": current_year,
            "year_end": current_year + 2,
            "status": ["Endorsed", "Submitted"],
        }


class TestBPImportValidate:
    client = APIClient()
    year_start = 2025
    params = f"?year_start={year_start}"
    url = reverse("bp-upload-validate") + params

    def test_bp_import_validate_permissions(
        self,
        bp_viewer_user,
        bp_editor_user,
        admin_user,
        secretariat_user,
        agency_user,
        agency_inputter_user,
        subsector_other,
        _setup_bp_activity_create,
    ):
        file_path = "core/api/tests/files/Test_BP2025-2027.xlsx"

        def _test_bp_import_validate_permissions(test_user, expected_status):
            self.client.force_authenticate(user=test_user)
            with open(file_path, "rb") as f:
                data = {"Test_BP2025-2027.xlsx": f}
                response = self.client.post(self.url, data, format="multipart")
                assert response.status_code == expected_status

        # check anon permissions
        _test_bp_import_validate_permissions(None, 403)
        _test_bp_import_validate_permissions(bp_viewer_user, 403)
        _test_bp_import_validate_permissions(agency_user, 403)
        _test_bp_import_validate_permissions(agency_inputter_user, 403)
        _test_bp_import_validate_permissions(secretariat_user, 200)
        _test_bp_import_validate_permissions(bp_editor_user, 200)
        _test_bp_import_validate_permissions(admin_user, 200)

    def test_bp_import_validate_invalid_template(
        self, bp_editor_user, subsector_other, _setup_bp_activity_create
    ):
        self.client.force_authenticate(user=bp_editor_user)
        file_path = "core/api/tests/files/Test_BP2025-2027_invalid_template.xlsx"

        with open(file_path, "rb") as f:
            data = {"Test_BP2025-2027.xlsx": f}
            response = self.client.post(self.url, data, format="multipart")

        assert response.status_code == 400
        assert len(response.data["errors"]) == 1
        assert (
            "The file you uploaded does not respect the required Excel template"
            in response.data["errors"][0]["error_message"]
        )

    def test_bp_import_validate_multiple_errors(
        self, bp_editor_user, subsector_other, _setup_bp_activity_create
    ):
        self.client.force_authenticate(user=bp_editor_user)
        file_path = "core/api/tests/files/Test_BP2025-2027_multiple_errors.xlsx"

        with open(file_path, "rb") as f:
            data = {"Test_BP2025-2027.xlsx": f}
            response = self.client.post(self.url, data, format="multipart")

        assert response.status_code == 200
        assert len(response.data["warnings"]) == 1

        assert response.data["warnings"][0]["warning_message"] == (
            "Subsector 'Subsector new' does not exist in KMS and will be set to 'Other'"
        )

        assert len(response.data["errors"]) == 2

        assert (
            "Agency 'NoAgency' does not exist"
            in response.data["errors"][0]["error_message"]
        )
        assert (
            "Country 'NoCountry' does not exist"
            in response.data["errors"][1]["error_message"]
        )

    def test_bp_import_validate_multiple_warnings(
        self, bp_editor_user, subsector_other, _setup_bp_activity_create
    ):
        self.client.force_authenticate(user=bp_editor_user)
        file_path = "core/api/tests/files/Test_BP2025-2027_multiple_warnings.xlsx"

        ProjectClusterFactory(name="Other", code="OTH")
        ProjectSectorFactory(name="Other", code="OTH")
        SubstanceFactory(name="Other substances")

        with open(file_path, "rb") as f:
            data = {"Test_BP2025-2027.xlsx": f}
            response = self.client.post(self.url, data, format="multipart")

        assert response.status_code == 200
        assert len(response.data["warnings"]) == 6
        assert len(response.data["errors"]) == 0
        assert (
            "Cluster 'NoCluster' does not exist"
            in response.data["warnings"][0]["warning_message"]
        )
        assert (
            "Sector 'NoSector' does not exist"
            in response.data["warnings"][1]["warning_message"]
        )
        assert (
            "Project type 'Project Type' is not linked to the cluster 'Other'"
            in response.data["warnings"][2]["warning_message"]
        )
        assert (
            "Some substances do not exist"
            in response.data["warnings"][3]["warning_message"]
        )
        assert (
            "Status 'Other' does not exist"
            in response.data["warnings"][4]["warning_message"]
        )
        assert (
            "Value odp for year 2025 (After: False) is not a number"
            in response.data["warnings"][5]["warning_message"]
        )

    def test_bp_import_validate(
        self, bp_editor_user, subsector_other, _setup_bp_activity_create
    ):
        self.client.force_authenticate(user=bp_editor_user)
        file_path = "core/api/tests/files/Test_BP2025-2027.xlsx"

        with open(file_path, "rb") as f:
            data = {"Test_BP2025-2027.xlsx": f}
            response = self.client.post(self.url, data, format="multipart")

        assert response.status_code == 200
        assert len(response.data["warnings"]) == 2
        assert len(response.data["errors"]) == 0
        assert response.data["activities_number"] == 1
        assert response.data["agencies_number"] == 1
        assert response.data["errors"] == []
        assert response.data["warnings"][0]["activity_id"] == "Agency-ROU-000000001"
        assert response.data["warnings"][0]["row_number"] == 2
        assert (
            "Subsector 'Not found' does not exist"
            in response.data["warnings"][0]["warning_message"]
        )
        assert (
            "Amount of Polyol is not a number"
            in response.data["warnings"][1]["warning_message"]
        )


class TestBPImport:
    client = APIClient()
    file_path = "core/api/tests/files/Test_BP2025-2027.xlsx"
    status = "Endorsed"
    year_start = 2025
    year_end = 2027
    params = f"?status={status}&year_start={year_start}&year_end={year_end}"
    url = reverse("bp-upload") + params

    def test_import_permissions(
        self,
        secretariat_user,
        agency_user,
        agency_inputter_user,
        bp_viewer_user,
        bp_editor_user,
        admin_user,
        meeting,
        decision,
        _setup_bp_activity_create,
    ):
        def _test_permissions(test_user, expected_status):
            self.client.force_authenticate(user=test_user)
            url = f"{self.url}&meeting_id={meeting.id}&decision_id={decision.id}"

            with open(self.file_path, "rb") as f:
                data = {"Test_BP2025-2027.xlsx": f}
                response = self.client.post(url, data, format="multipart")
                assert response.status_code == expected_status

        # check anon permissions
        _test_permissions(None, 403)

        _test_permissions(bp_viewer_user, 403)
        _test_permissions(agency_user, 403)
        _test_permissions(agency_inputter_user, 403)
        _test_permissions(secretariat_user, 200)
        _test_permissions(bp_editor_user, 200)
        _test_permissions(admin_user, 200)

    def test_bp_import(
        self,
        bp_editor_user,
        meeting,
        decision,
        agency,
        country_ro,
        project_type,
        bp_chemical_type,
        substance,
        sector,
        subsector_other,
        _setup_bp_activity_create,
    ):
        self.client.force_authenticate(user=bp_editor_user)
        url = f"{self.url}&meeting_id={meeting.id}&decision_id={decision.id}"

        with open(self.file_path, "rb") as f:
            data = {"Test_BP2025-2027.xlsx": f}
            response = self.client.post(url, data, format="multipart")

        assert response.status_code == 200
        assert response.data == "Data imported successfully"

        business_plan = BusinessPlan.objects.get(
            status=self.status,
            year_start=self.year_start,
            year_end=self.year_end,
            meeting=meeting,
            decision=decision,
        )
        activity = business_plan.activities.first()
        assert activity.title == "Planu"
        assert activity.agency == agency
        assert activity.country == country_ro
        assert activity.lvc_status == "LVC"
        assert activity.project_type == project_type
        assert activity.bp_chemical_type == bp_chemical_type
        assert activity.substances.first() == substance
        assert activity.sector == sector
        assert activity.subsector == subsector_other
        assert activity.amount_polyol == 0
        assert activity.status == "A"
        assert activity.is_multi_year is False
        assert activity.remarks == "Merge bine, bine, bine ca aeroplanu"
        for index, value in enumerate(activity.values.all()):
            amount = 100 * (index + 1)
            if index == 3:
                year = self.year_start + 2
                is_after = True
            else:
                year = self.year_start + index
                is_after = False

            assert value.year == year
            assert value.is_after == is_after
            assert value.value_usd == amount
            assert value.value_odp == amount
            assert value.value_mt == amount
            assert value.value_co2 == amount


class TestBPUpdate:
    client = APIClient()

    def test_update_permissions(
        self,
        bp_viewer_user,
        bp_editor_user,
        secretariat_user,
        agency_user,
        agency_inputter_user,
        admin_user,
        _setup_bp_activity_create,
        substance,
    ):
        def _test_permissions(test_user, expected_status):
            business_plan = BusinessPlanFactory()
            self.client.force_authenticate(user=test_user)
            url = reverse("businessplan-list") + f"{business_plan.id}/"
            activity_data = _setup_bp_activity_create
            activity_data.pop("initial_id", None)  # remove initial_id for update
            activity_data["substances"] = [substance.id]
            activity_data["business_plan_id"] = business_plan.id
            activity_data["title"] = "Title test"
            activity_data["status"] = "P"
            activity_data["is_multi_year"] = False
            activity_data["remarks"] = "Remarks test"
            activity_data["values"] = [
                {
                    "year": business_plan.year_end,
                    "is_after": False,
                    "value_usd": 100,
                    "value_odp": 100,
                    "value_mt": 100,
                }
            ]
            data = {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "status": business_plan.status,
                "activities": [],
            }
            response = self.client.put(url, data, format="json")
            assert response.status_code == expected_status

        # check anon permissions
        _test_permissions(None, 403)

        _test_permissions(bp_viewer_user, 403)
        _test_permissions(bp_editor_user, 200)
        _test_permissions(agency_user, 403)
        _test_permissions(agency_inputter_user, 403)
        _test_permissions(secretariat_user, 200)
        _test_permissions(admin_user, 200)

    def test_update_wrong_activity_values(
        self, bp_editor_user, _setup_bp_activity_create, business_plan
    ):
        self.client.force_authenticate(user=bp_editor_user)
        url = reverse("businessplan-list") + f"{business_plan.id}/"

        # year not in business plan interval
        activity_data = _setup_bp_activity_create
        activity_data["values"] = [
            {
                "year": business_plan.year_end + 1,  # wrong year
                "is_after": False,
                "value_usd": 100,
                "value_odp": 100,
                "value_mt": 100,
            }
        ]
        data = {
            "year_start": business_plan.year_start,
            "year_end": business_plan.year_end,
            "status": business_plan.status,
            "activities": [activity_data],
        }
        response = self.client.put(url, data, format="json")

        assert response.status_code == 400
        assert (
            response.data["general_error"]
            == "BP activity values year not in business plan interval"
        )

        # multiple values with `is_after=true`
        activity_data["values"] = [
            {
                "year": business_plan.year_start,
                "is_after": True,
                "value_usd": 100,
                "value_odp": 100,
                "value_mt": 100,
            },
            {
                "year": business_plan.year_end,
                "is_after": True,
                "value_usd": 200,
                "value_odp": 200,
                "value_mt": 200,
            },
        ]
        data["activities"] = [activity_data]
        response = self.client.put(url, data, format="json")

        assert response.status_code == 400
        assert (
            response.data["activities"][0]["values"][0]
            == "Multiple values with is_after=true found"
        )

    def test_bp_update(
        self,
        bp_editor_user,
        _setup_bp_activity_create,
        business_plan,
        substance,
    ):
        self.client.force_authenticate(user=bp_editor_user)

        url = reverse("businessplan-list") + f"{business_plan.id}/"
        other_business_plan = BusinessPlanFactory()
        activity_data = _setup_bp_activity_create
        substance2 = SubstanceFactory.create(name="substance2")
        activity_data.pop("initial_id", None)
        activity_data["substances"] = [substance.id, substance2.id]
        activity_data["business_plan_id"] = other_business_plan.id  # should be ignored
        activity_data["title"] = "Planu 2"
        activity_data["status"] = "P"
        activity_data["is_multi_year"] = True
        activity_data["remarks"] = "Merge rau"
        activity_data["values"] = [
            {
                "year": business_plan.year_end,
                "is_after": False,
                "value_usd": 300,
                "value_odp": 300,
                "value_mt": 300,
            }
        ]
        data = {
            "year_start": business_plan.year_start,
            "year_end": business_plan.year_end,
            "status": business_plan.status,
            "activities": [activity_data],
        }
        response = self.client.put(url, data, format="json")

        assert response.status_code == 200
        assert (
            response.data["name"]
            == f"{business_plan.status} {business_plan.year_start} - {business_plan.year_end}"
        )
        activities = response.data["activities"]
        assert activities[0]["business_plan_id"] == response.data["id"]
        assert activities[0]["title"] == "Planu 2"
        assert activities[0]["substances"] == [substance.id, substance2.id]
        assert activities[0]["status"] == "P"
        assert activities[0]["is_multi_year"] is True
        assert activities[0]["remarks"] == "Merge rau"
        assert activities[0]["values"][0]["year"] == business_plan.year_end


@pytest.fixture(name="_setup_bp_activity_list")
def setup_bp_activity_list(
    business_plan,
    agency,
    country_ro,
    sector,
    subsector,
    project_type,
    bp_chemical_type,
    substance,
    project_cluster_kpp,
):
    countries = [country_ro]
    subsectors = [subsector]
    project_types = [project_type]
    clusters = [project_cluster_kpp]
    another_bp = BusinessPlanFactory.create(
        year_start=business_plan.year_start - 1,
        year_end=business_plan.year_end - 1,
    )
    for i in range(4):
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
                "agency": agency,
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
            }
            bp_activity = BPActivityFactory.create(**data)
            bp_activity.substances.set([substance])
            for i in range(business_plan.year_start, business_plan.year_end + 1):
                BPActivityValueFactory.create(
                    bp_activity=bp_activity,
                    year=business_plan.year_start + i,
                    value_usd=i,
                    value_odp=i,
                    value_mt=i,
                )


class TestBPActivityList:
    client = APIClient()
    url = reverse("bpactivity-list")

    def test_list_permissions(
        self,
        secretariat_user,
        agency_user,
        agency_inputter_user,
        bp_viewer_user,
        bp_editor_user,
        business_plan,
        admin_user,
    ):
        def _test_permissions(test_user, expected_status):
            self.client.force_authenticate(user=test_user)
            response = self.client.get(
                self.url,
                {
                    "year_start": business_plan.year_start,
                    "year_end": business_plan.year_end,
                    "bp_status": business_plan.status,
                },
            )
            assert response.status_code == expected_status

        # check anon permissions
        _test_permissions(None, 403)

        _test_permissions(bp_viewer_user, 200)
        _test_permissions(agency_user, 200)
        _test_permissions(agency_inputter_user, 200)
        _test_permissions(secretariat_user, 200)
        _test_permissions(bp_editor_user, 200)
        _test_permissions(admin_user, 200)

    def test_activity_list(
        self, bp_viewer_user, _setup_bp_activity_list, business_plan
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        # get by start_year, end_year
        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "bp_status": business_plan.status,
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 4

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start - 1,
                "year_end": business_plan.year_end,
                "bp_status": business_plan.status,
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 8

    def test_country_filter(
        self, bp_viewer_user, business_plan, country_ro, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "bp_status": business_plan.status,
                "country_id": country_ro.id,
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["country"]["id"] == country_ro.id

    def test_invalid_country_filter(
        self, bp_viewer_user, _setup_bp_activity_list, business_plan
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "bp_status": business_plan.status,
                "country_id": 999,
            },
        )
        assert response.status_code == 400

    def test_status_filter(
        self, bp_viewer_user, business_plan, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "bp_status": business_plan.status,
                "status": "A",
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 4
        assert response.json()[0]["status"] == "A"

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "bp_status": business_plan.status,
                "status": "U",
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 0

    def test_search_filter(
        self, bp_viewer_user, business_plan, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "bp_status": business_plan.status,
                "search": "Planu2",
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["title"] == "Planu2"

    def test_agency_filter(
        self, bp_viewer_user, agency, business_plan, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "bp_status": business_plan.status,
                "agency_id": agency.id,
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 4
        assert response.json()[0]["agency"]["name"] == agency.name

    def test_invalid_agency(
        self, bp_viewer_user, business_plan, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "bp_status": business_plan.status,
                "agency_id": 999,
            },
        )
        assert response.status_code == 400

    def test_invalid_bp_status(
        self, bp_viewer_user, business_plan, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "bp_status": "Draft",
            },
        )
        assert response.status_code == 400


class TestBPGet:
    client = APIClient()
    url = reverse("businessplan-get")

    def test_get_permissions(
        self,
        secretariat_user,
        agency_user,
        agency_inputter_user,
        bp_viewer_user,
        bp_editor_user,
        admin_user,
        business_plan,
    ):
        def _test_permissions(test_user, expected_status):
            self.client.force_authenticate(user=test_user)
            response = self.client.get(self.url, {"business_plan_id": business_plan.id})
            assert response.status_code == expected_status

        # check anon permissions
        _test_permissions(None, 403)

        _test_permissions(bp_viewer_user, 200)
        _test_permissions(bp_editor_user, 200)
        _test_permissions(secretariat_user, 200)
        _test_permissions(agency_user, 200)
        _test_permissions(agency_inputter_user, 200)
        _test_permissions(admin_user, 200)

    def test_activity_list(
        self, bp_viewer_user, _setup_bp_activity_list, business_plan
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        # get by id
        response = self.client.get(self.url, {"business_plan_id": business_plan.id})
        assert response.status_code == 200
        assert len(response.json()["activities"]) == 4

        # get by start_year, end_year, status
        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "bp_status": business_plan.status,
            },
        )
        assert response.status_code == 200
        assert len(response.json()["activities"]) == 4

    def test_country_filter(
        self, bp_viewer_user, business_plan, country_ro, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "country_id": country_ro.id},
        )
        assert response.status_code == 200
        assert len(response.json()["activities"]) == 1
        assert response.json()["activities"][0]["country"]["id"] == country_ro.id

    def test_invalid_country_filter(
        self, bp_viewer_user, _setup_bp_activity_list, business_plan
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "country_id": 999},
        )
        assert response.status_code == 400

    def test_status_filter(
        self, bp_viewer_user, business_plan, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "status": "A"},
        )
        assert response.status_code == 200
        assert len(response.json()["activities"]) == 4
        assert response.json()["activities"][0]["status"] == "A"

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "status": "U"},
        )
        assert response.status_code == 200
        assert len(response.json()["activities"]) == 0

    def test_search_filter(
        self, bp_viewer_user, business_plan, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "search": "Planu2"},
        )
        assert response.status_code == 200
        assert len(response.json()["activities"]) == 1
        assert response.json()["activities"][0]["title"] == "Planu2"

    def test_invalid_bp_id(self, bp_viewer_user, _setup_bp_activity_list):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {"business_plan_id": 999},
        )
        assert response.status_code == 400

    def test_invalid_year(self, bp_viewer_user, business_plan, _setup_bp_activity_list):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {
                "year_start": 99,
                "year_end": 999,
                "bp_status": business_plan.status,
            },
        )
        assert response.status_code == 400

    def test_invalid_agency(
        self, bp_viewer_user, business_plan, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {
                "agency_id": 999,
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "bp_status": business_plan.status,
            },
        )
        assert response.status_code == 400

    def test_invalid_bp_status(
        self, bp_viewer_user, business_plan, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=bp_viewer_user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "bp_status": "Draft",
            },
        )
        assert response.status_code == 400
