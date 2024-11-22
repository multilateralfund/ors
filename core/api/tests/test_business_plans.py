import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from unittest.mock import patch

from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    AgencyFactory,
    BPActivityFactory,
    BPActivityValueFactory,
    BPChemicalTypeFactory,
    BusinessPlanFactory,
    CommentTypeFactory,
    CountryFactory,
    ProjectClusterFactory,
    ProjectSectorFactory,
    ProjectSubSectorFactory,
    ProjectTypeFactory,
    SubstanceFactory,
    UserFactory,
)

pytestmark = pytest.mark.django_db
# pylint: disable=C8008, W0221, R0913, C0302, R0914, R0915


@pytest.fixture(name="new_agency_user")
def _new_agency_user(new_agency):
    return UserFactory.create(agency=new_agency, user_type="agency_submitter")


@pytest.fixture(name="mock_send_mail_bp_create")
def _mock_send_mail_bp_create():
    with patch("core.tasks.send_mail_bp_create.delay") as send_mail:
        yield send_mail


@pytest.fixture(name="mock_send_mail_bp_update")
def _mock_send_mail_bp_update():
    with patch("core.tasks.send_mail_bp_update.delay") as send_mail:
        yield send_mail


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
def setup_bp_list(agency, new_agency):
    for i in range(3):
        for ag, status in [(agency, "Consolidated"), (new_agency, "Endorsed")]:
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

    def test_list(self, user, agency_user, _setup_bp_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.json()) == 6

        self.client.force_authenticate(user=agency_user)
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.json()) == 3

    def test_list_agency_filter(self, user, _setup_bp_list, agency):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"agency_id": agency.id})
        assert response.status_code == 200
        assert len(response.json()) == 3
        assert all(bp["agency"]["id"] == agency.id for bp in response.json())

    def test_list_status_filter(self, user, _setup_bp_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"status": "Endorsed"})
        assert response.status_code == 200
        assert len(response.json()) == 3
        assert all(bp["status"] == "Endorsed" for bp in response.json())

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


@pytest.fixture(name="_setup_new_business_plan_create")
def setup_new_business_plan_create(agency):
    return {
        "name": "Test BP",
        "agency_id": agency.id,
        "year_start": 2020,
        "year_end": 2023,
        "status": "Endorsed",
    }


class TestBPCreate:
    client = APIClient()
    url = reverse("businessplan-list")

    def test_without_login(
        self, _setup_bp_activity_create, _setup_new_business_plan_create
    ):
        data = _setup_new_business_plan_create
        data["activities"] = [_setup_bp_activity_create]
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 403

    def test_without_permission_wrong_agency(
        self,
        new_agency_user,
        _setup_bp_activity_create,
        _setup_new_business_plan_create,
    ):
        self.client.force_authenticate(user=new_agency_user)

        data = _setup_new_business_plan_create
        data["activities"] = [_setup_bp_activity_create]
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 403

    def test_wrong_sector_type_mapping(
        self, agency_user, _setup_bp_activity_create, _setup_new_business_plan_create
    ):
        self.client.force_authenticate(user=agency_user)

        data = _setup_new_business_plan_create
        activity_data = _setup_bp_activity_create
        activity_data["sector_code"] = "TAS"
        data["activities"] = [activity_data]

        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert (
            response.data["activities"][0]["non_field_errors"][0]
            == "Invalid sector - type combination"
        )

    def test_create_wrong_activity_values(
        self, agency_user, _setup_bp_activity_create, _setup_new_business_plan_create
    ):
        self.client.force_authenticate(user=agency_user)

        # year not in business plan interval
        data = _setup_new_business_plan_create
        activity_data = _setup_bp_activity_create
        activity_data["values"] = [
            {
                "year": 2025,  # wrong year
                "is_after": False,
                "value_usd": 100,
                "value_odp": 100,
                "value_mt": 100,
            }
        ]
        data["activities"] = [activity_data]
        response = self.client.post(self.url, data, format="json")

        assert response.status_code == 400
        assert (
            response.data["general_error"]
            == "BP activity values year not in business plan interval"
        )

        # multiple values with `is_after=true`
        activity_data["values"] = [
            {
                "year": 2020,
                "is_after": True,
                "value_usd": 100,
                "value_odp": 100,
                "value_mt": 100,
            },
            {
                "year": 2021,
                "is_after": True,
                "value_usd": 200,
                "value_odp": 200,
                "value_mt": 200,
            },
        ]
        data["activities"] = [activity_data]
        response = self.client.post(self.url, data, format="json")

        assert response.status_code == 400
        assert (
            response.data["activities"][0]["values"][0]
            == "Multiple values with is_after=true found"
        )

    def test_bp_create(
        self,
        agency_user,
        agency,
        country_ro,
        substance,
        sector,
        subsector,
        project_type,
        bp_chemical_type,
        comment_type,
        _setup_bp_activity_create,
        _setup_new_business_plan_create,
        mock_send_mail_bp_create,
    ):
        self.client.force_authenticate(user=agency_user)

        data = _setup_new_business_plan_create
        # comment data should be ignored
        activity_data = _setup_bp_activity_create
        activity_data["comment_secretariat"] = "Alo, alo, Te-am sunat sa-ti spun"
        activity_data["comment_types"] = [comment_type.id]
        data["activities"] = [activity_data]

        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 201
        assert response.data["name"] == "Test BP"
        assert response.data["status"] == "Endorsed"
        assert response.data["year_start"] == 2020
        assert response.data["year_end"] == 2023
        assert response.data["agency_id"] == agency.id

        activities = response.data["activities"]
        assert activities[0]["business_plan_id"] == response.data["id"]
        assert activities[0]["title"] == "Planu"
        assert activities[0]["country_id"] == country_ro.id
        assert activities[0]["lvc_status"] == "LVC"
        assert activities[0]["project_type_id"] == project_type.id
        assert activities[0]["bp_chemical_type_id"] == bp_chemical_type.id
        assert activities[0]["substances"] == [substance.id]
        assert activities[0]["sector_id"] == sector.id
        assert activities[0]["subsector_id"] == subsector.id
        assert activities[0]["status"] == "A"
        assert activities[0]["is_multi_year"] is False
        assert activities[0]["remarks"] == "Merge bine, bine, bine ca aeroplanu"
        assert activities[0]["comment_secretariat"] == ""
        assert activities[0]["comment_types"] == []
        assert activities[0]["values"][0]["year"] == 2020
        assert activities[0]["is_updated"] is False

        mock_send_mail_bp_create.assert_called_once()


class TestBPUpdate:
    client = APIClient()

    def test_without_login(self, _setup_bp_activity_create, business_plan):
        url = reverse("businessplan-list") + f"{business_plan.id}/"
        data = {
            "agency_id": business_plan.agency_id,
            "year_start": business_plan.year_start,
            "year_end": business_plan.year_end,
            "status": business_plan.status,
            "activities": [_setup_bp_activity_create],
        }
        response = self.client.put(url, data, format="json")
        assert response.status_code == 403

    def test_without_permission_wrong_agency(
        self, new_agency_user, _setup_bp_activity_create, business_plan
    ):
        self.client.force_authenticate(user=new_agency_user)

        url = reverse("businessplan-list") + f"{business_plan.id}/"
        data = {
            "agency_id": business_plan.agency_id,
            "year_start": business_plan.year_start,
            "year_end": business_plan.year_end,
            "status": business_plan.status,
            "activities": [_setup_bp_activity_create],
        }
        response = self.client.put(url, data, format="json")
        assert response.status_code == 403

    def test_wrong_sector_type_mapping(
        self, agency_user, _setup_bp_activity_create, business_plan
    ):
        self.client.force_authenticate(user=agency_user)
        url = reverse("businessplan-list") + f"{business_plan.id}/"

        activity_data = _setup_bp_activity_create
        activity_data["sector_code"] = "TAS"
        data = {
            "agency_id": business_plan.agency_id,
            "year_start": business_plan.year_start,
            "year_end": business_plan.year_end,
            "status": business_plan.status,
            "activities": [activity_data],
        }

        response = self.client.put(url, data, format="json")
        assert response.status_code == 400
        assert (
            response.data["activities"][0]["non_field_errors"][0]
            == "Invalid sector - type combination"
        )

    def test_update_wrong_activity_values(
        self, agency_user, _setup_bp_activity_create, business_plan
    ):
        self.client.force_authenticate(user=agency_user)
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
            "agency_id": business_plan.agency_id,
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

    def test_update_old_bp(
        self, agency_user, _setup_bp_activity_create, old_business_plan
    ):
        self.client.force_authenticate(user=agency_user)

        url = reverse("businessplan-list") + f"{old_business_plan.id}/"
        data = {
            "agency_id": old_business_plan.agency_id,
            "year_start": old_business_plan.year_start,
            "year_end": old_business_plan.year_end,
            "status": old_business_plan.status,
            "activities": [_setup_bp_activity_create],
        }
        response = self.client.put(url, data, format="json")
        assert response.status_code == 404

    def test_is_updated(self, agency_user, _setup_bp_activity_create, business_plan):
        self.client.force_authenticate(user=agency_user)

        url = reverse("businessplan-list") + f"{business_plan.id}/"
        data = {
            "agency_id": business_plan.agency_id,
            "year_start": business_plan.year_start,
            "year_end": business_plan.year_end,
            "status": business_plan.status,
            "activities": [_setup_bp_activity_create],
        }
        # update bp activity
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data["id"]
        activities = response.data["activities"]
        assert activities[0]["is_updated"] is True

        # get new BP by id
        url = reverse("businessplan-get")
        response = self.client.get(url, {"business_plan_id": new_id})
        assert response.status_code == 200
        data["activities"] = response.json()["activities"]

        # update bp again without changes
        url = reverse("businessplan-list") + f"{new_id}/"
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        activities = response.data["activities"]
        assert activities[0]["is_updated"] is False

    def test_bp_update_agency(
        self,
        agency_user,
        _setup_bp_activity_create,
        business_plan,
        substance,
        comment_type,
        mock_send_mail_bp_update,
    ):
        self.client.force_authenticate(user=agency_user)

        url = reverse("businessplan-list") + f"{business_plan.id}/"
        other_business_plan = BusinessPlanFactory()
        activity_data = _setup_bp_activity_create
        substance2 = SubstanceFactory.create(name="substance2")
        activity_data["substances"] = [substance.id, substance2.id]
        activity_data["business_plan_id"] = other_business_plan.id  # should be ignored
        activity_data["title"] = "Planu 2"
        activity_data["status"] = "P"
        activity_data["is_multi_year"] = True
        activity_data["remarks"] = "Merge rau"
        # agency updates BP (comment is deleted)
        activity_data["comment_secretariat"] = "Nu inchide telefonu"
        activity_data["comment_types"] = [comment_type.id]
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
            "agency_id": business_plan.agency_id,
            "year_start": business_plan.year_start,
            "year_end": business_plan.year_end,
            "status": business_plan.status,
            "activities": [activity_data],
        }
        response = self.client.put(url, data, format="json")

        assert response.status_code == 200
        assert (
            response.data["name"]
            == f"{business_plan.agency} {business_plan.year_start} - {business_plan.year_end}"
        )
        activities = response.data["activities"]
        assert activities[0]["business_plan_id"] == response.data["id"]
        assert activities[0]["title"] == "Planu 2"
        assert activities[0]["substances"] == [substance.id, substance2.id]
        assert activities[0]["status"] == "P"
        assert activities[0]["is_multi_year"] is True
        assert activities[0]["remarks"] == "Merge rau"
        assert activities[0]["comment_secretariat"] == ""
        assert activities[0]["comment_types"] == []
        assert activities[0]["values"][0]["year"] == business_plan.year_end
        assert activities[0]["is_updated"] is True

        mock_send_mail_bp_update.assert_called_once()

    def test_bp_update_secretariat(
        self,
        user,
        _setup_bp_activity_create,
        business_plan,
        comment_type,
        mock_send_mail_bp_update,
    ):
        self.client.force_authenticate(user=user)

        url = reverse("businessplan-list") + f"{business_plan.id}/"
        activity_data = _setup_bp_activity_create
        # only secretariat can update comments
        activity_data["comment_secretariat"] = "Nu inchide telefonu"
        activity_data["comment_types"] = [comment_type.id]
        data = {
            "agency_id": business_plan.agency_id,
            "year_start": business_plan.year_start,
            "year_end": business_plan.year_end,
            "status": business_plan.status,
            "activities": [activity_data],
        }
        response = self.client.put(url, data, format="json")

        assert response.status_code == 200
        activities = response.data["activities"]
        assert activities[0]["comment_secretariat"] == "Nu inchide telefonu"
        assert activities[0]["comment_types"] == [comment_type.id]
        assert activities[0]["is_updated"] is True

        mock_send_mail_bp_update.assert_called_once()


@pytest.fixture(name="_setup_bp_activity_list")
def setup_bp_activity_list(
    business_plan,
    old_business_plan,
    country_ro,
    sector,
    subsector,
    project_type,
    bp_chemical_type,
    substance,
    project_cluster_kpp,
    new_agency,
    comment_type,
):
    countries = [country_ro]
    subsectors = [subsector]
    project_types = [project_type]
    clusters = [project_cluster_kpp]
    new_bp = BusinessPlanFactory.create(
        agency=new_agency,
        year_start=business_plan.year_start,
        year_end=business_plan.year_end,
    )
    another_bp = BusinessPlanFactory.create(
        agency=business_plan.agency,
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

    for bp in [business_plan, old_business_plan, another_bp, new_bp]:
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
                "comment_secretariat": f"Alo, alo, Te-am sunat sa-ti spun{i}",
            }
            bp_activity = BPActivityFactory.create(**data)
            bp_activity.substances.set([substance])
            bp_activity.comment_types.set([comment_type])
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

    def test_list_anon(self, business_plan):
        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
            },
        )
        assert response.status_code == 403

    def test_activity_list(self, user, _setup_bp_activity_list, business_plan):
        self.client.force_authenticate(user=user)

        # get by start_year, end_year
        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 8

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start - 1,
                "year_end": business_plan.year_end,
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 12

    def test_country_filter(
        self, agency_user, business_plan, country_ro, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=agency_user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "country_id": country_ro.id,
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["country"]["id"] == country_ro.id

    def test_invalid_country_filter(self, user, _setup_bp_activity_list, business_plan):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "country_id": 999,
            },
        )
        assert response.status_code == 400

    def test_status_filter(self, agency_user, business_plan, _setup_bp_activity_list):
        self.client.force_authenticate(user=agency_user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
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
                "status": "U",
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 0

    def test_search_filter(self, agency_user, business_plan, _setup_bp_activity_list):
        self.client.force_authenticate(user=agency_user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "search": "Planu2",
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["title"] == "Planu2"

    def test_agency_filter(self, user, business_plan, _setup_bp_activity_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "agency_id": business_plan.agency_id,
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 4
        assert response.json()[0]["agency"] == business_plan.agency.name

    def test_invalid_agency(self, user, business_plan, _setup_bp_activity_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "agency_id": 999,
            },
        )
        assert response.status_code == 400

    def test_all_for_new_user(
        self, new_agency_user, business_plan, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=new_agency_user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 4

    def test_comment_type_filter(
        self, agency_user, business_plan, comment_type, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=agency_user)

        other_comment_type = CommentTypeFactory()
        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "comment_types": f"{comment_type.id},{other_comment_type.id}",
            },
        )
        assert response.status_code == 200
        assert len(response.json()) == 4
        assert response.json()[0]["comment_types"] == [comment_type.name]


class TestBPGet:
    client = APIClient()
    url = reverse("businessplan-get")

    def test_list_anon(self, business_plan):
        response = self.client.get(self.url, {"business_plan_id": business_plan.id})
        assert response.status_code == 403

    def test_without_permission(self, new_agency_user, business_plan):
        self.client.force_authenticate(user=new_agency_user)

        response = self.client.get(self.url, {"business_plan_id": business_plan.id})
        assert response.status_code == 403

    def test_activity_list(
        self, user, _setup_bp_activity_list, business_plan, old_business_plan
    ):
        self.client.force_authenticate(user=user)

        # get by id
        response = self.client.get(self.url, {"business_plan_id": business_plan.id})
        assert response.status_code == 200
        assert len(response.json()["activities"]) == 4

        # get by agency, start_year, end_year, version
        response = self.client.get(
            self.url,
            {
                "agency_id": business_plan.agency_id,
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "version": old_business_plan.version,
            },
        )
        assert response.status_code == 200
        assert len(response.json()["activities"]) == 4

        # get by agency, start_year, end_year (latest version)
        response = self.client.get(
            self.url,
            {
                "agency_id": business_plan.agency_id,
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
            },
        )
        assert response.status_code == 200
        assert len(response.json()["activities"]) == 4

    def test_country_filter(
        self, user, business_plan, country_ro, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "country_id": country_ro.id},
        )
        assert response.status_code == 200
        assert len(response.json()["activities"]) == 1
        assert response.json()["activities"][0]["country"]["id"] == country_ro.id

    def test_invalid_country_filter(self, user, _setup_bp_activity_list, business_plan):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "country_id": 999},
        )
        assert response.status_code == 400

    def test_status_filter(self, user, business_plan, _setup_bp_activity_list):
        self.client.force_authenticate(user=user)

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

    def test_search_filter(self, user, business_plan, _setup_bp_activity_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {"business_plan_id": business_plan.id, "search": "Planu2"},
        )
        assert response.status_code == 200
        assert len(response.json()["activities"]) == 1
        assert response.json()["activities"][0]["title"] == "Planu2"

    def test_invalid_bp_id(self, user, _setup_bp_activity_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {"business_plan_id": 999},
        )
        assert response.status_code == 400

    def test_invalid_year(self, user, business_plan, _setup_bp_activity_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {
                "agency_id": business_plan.agency_id,
                "year_start": 99,
                "year_end": 999,
            },
        )
        assert response.status_code == 400

    def test_invalid_agency(self, user, business_plan, _setup_bp_activity_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {
                "agency_id": 999,
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
            },
        )
        assert response.status_code == 400

    def test_comment_type_filter(
        self, user, business_plan, comment_type, _setup_bp_activity_list
    ):
        self.client.force_authenticate(user=user)

        other_comment_type = CommentTypeFactory()
        response = self.client.get(
            self.url,
            {
                "business_plan_id": business_plan.id,
                "comment_types": f"{comment_type.id},{other_comment_type.id}",
            },
        )
        assert response.status_code == 200
        assert len(response.json()["activities"]) == 4
        assert response.json()["activities"][0]["comment_types"] == [comment_type.name]


class TestUpdateAllActivities:
    client = APIClient()
    url = reverse("businessplan-update-all")

    def test_update_all_activities(
        self,
        user,
        business_plan,
        country_ro,
        substance,
        sector,
        subsector,
        project_type,
        bp_chemical_type,
        _setup_bp_activity_create,
    ):
        self.client.force_authenticate(user=user)

        other_agency = AgencyFactory(name="Agency2", code="AG2")
        other_business_plan = BusinessPlanFactory(
            agency=other_agency,
            year_start=business_plan.year_start,
            year_end=business_plan.year_end,
            version=1,
        )

        activity_data_1 = _setup_bp_activity_create.copy()
        activity_data_2 = _setup_bp_activity_create.copy()
        activity_data_1["agency_id"] = business_plan.agency_id
        activity_data_2["agency_id"] = other_business_plan.agency_id

        data = {
            "year_start": business_plan.year_start,
            "year_end": business_plan.year_end,
            "status": business_plan.status,
            "activities": [activity_data_1, activity_data_2],
        }
        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 200

        for data in response.data:
            assert data["year_start"] == business_plan.year_start
            assert data["year_end"] == business_plan.year_end
            assert data["status"] == business_plan.status

            activities = data["activities"]
            assert activities[0]["business_plan_id"] == data["id"]
            assert activities[0]["title"] == "Planu"
            assert activities[0]["country_id"] == country_ro.id
            assert activities[0]["lvc_status"] == "LVC"
            assert activities[0]["project_type_id"] == project_type.id
            assert activities[0]["bp_chemical_type_id"] == bp_chemical_type.id
            assert activities[0]["substances"] == [substance.id]
            assert activities[0]["sector_id"] == sector.id
            assert activities[0]["subsector_id"] == subsector.id
            assert activities[0]["status"] == "A"
            assert activities[0]["is_multi_year"] is False
            assert activities[0]["remarks"] == "Merge bine, bine, bine ca aeroplanu"
            assert activities[0]["values"][0]["year"] == 2020
