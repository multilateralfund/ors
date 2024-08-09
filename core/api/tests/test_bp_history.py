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
        "status": BusinessPlan.Status.agency_draft,
    }


class TestBPHistory:
    client = APIClient()

    def test_create_history(
        self, user, agency_user, agency_inputter_user, _setup_new_business_plan_create
    ):
        VALIDATION_LIST = [
            ("created by user", 4, 1, agency_user.username),
            ("updated by user", 3, 1, agency_inputter_user.username),
            ("status updated", 2, 1, agency_user.username),
            ("status updated", 1, 2, user.username),
            ("updated by user", 0, 2, user.username),
        ]

        # create new business plan
        self.client.force_authenticate(user=agency_user)
        url = reverse("businessplan-list")
        response = self.client.post(url, _setup_new_business_plan_create, format="json")
        assert response.status_code == 201
        business_plan_id = response.data["id"]

        # update business plan
        self.client.force_authenticate(user=agency_inputter_user)
        url = reverse("businessplan-list") + f"{business_plan_id}/"
        data = _setup_new_business_plan_create
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data["id"]

        # update status to submitted
        self.client.force_authenticate(user=agency_user)
        url = reverse("business-plan-status", kwargs={"id": new_id})
        response = self.client.put(url, {"status": "Submitted"})
        assert response.status_code == 200

        # update status to secretariat draft
        self.client.force_authenticate(user=user)
        response = self.client.put(url, {"status": "Secretariat Draft"})
        assert response.status_code == 200

        # update business plan
        url = reverse("businessplan-list") + f"{new_id}/"
        data["status"] = "Secretariat Draft"
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data["id"]

        # check 5 history objects created
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
