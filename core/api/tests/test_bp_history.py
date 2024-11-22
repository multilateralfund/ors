import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.models.business_plan import BusinessPlan, BPHistory

pytestmark = pytest.mark.django_db


@pytest.fixture(name="_setup_new_business_plan_create")
def setup_new_business_plan_create(agency):
    return {
        "name": "Test BP",
        "agency_id": agency.id,
        "year_start": 2020,
        "year_end": 2022,
        "status": BusinessPlan.Status.endorsed,
    }


class TestBPHistory:
    client = APIClient()

    def test_create_history(
        self,
        user,
        agency_user,
        _setup_new_business_plan_create,
        _setup_bp_activity_create,
    ):
        VALIDATION_LIST = [
            ("created by user", 1, 1, agency_user.username),
            ("updated by user", 0, 1, user.username),
        ]

        # create new business plan
        self.client.force_authenticate(user=agency_user)
        url = reverse("businessplan-list")
        response = self.client.post(url, _setup_new_business_plan_create, format="json")
        assert response.status_code == 201
        business_plan_id = response.data["id"]

        # update business plan
        self.client.force_authenticate(user=user)
        url = reverse("businessplan-list") + f"{business_plan_id}/"
        data = {
            "agency_id": agency_user.agency_id,
            "year_start": 2020,
            "year_end": 2022,
            "status": BusinessPlan.Status.endorsed,
            "activities": [_setup_bp_activity_create],
        }
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data["id"]

        # check 2 history objects created
        history = BPHistory.objects.filter(business_plan_id=new_id)
        assert history.count() == len(VALIDATION_LIST)

        for valid_string, i, version, req_user in VALIDATION_LIST:
            assert history[i].updated_by.username == req_user
            assert valid_string in history[i].event_description.lower()
            assert history[i].bp_version == version

        # check history in API response
        url = reverse("businessplan-get")
        response = self.client.get(url, {"business_plan_id": new_id})
        assert response.status_code == 200

        # check same history items in get business plan
        history = response.data["history"]
        assert len(history) == len(VALIDATION_LIST)

        for valid_string, i, version, req_user in VALIDATION_LIST:
            assert history[i]["updated_by_username"] == req_user
            assert valid_string in history[i]["event_description"].lower()
            assert history[i]["bp_version"] == version
