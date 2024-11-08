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
        self,
        user,
        agency_user,
        _setup_new_business_plan_create,
        _setup_bp_activity_create,
    ):
        VALIDATION_LIST_FULL_HISTORY = [
            ("created by user", 4, 1, agency_user.username),
            ("updated by user", 3, 1, agency_user.username),
            ("status updated", 2, 1, user.username),
            ("consolidated data updated", 1, 2, user.username),
            ("consolidated data updated", 0, 2, user.username),
        ]
        VALIDATION_LIST = [
            ("updated by user", 1, 1, agency_user.username),
            ("consolidated data updated", 0, 2, user.username),
        ]

        # create new business plan
        self.client.force_authenticate(user=agency_user)
        url = reverse("businessplan-list")
        response = self.client.post(url, _setup_new_business_plan_create, format="json")
        assert response.status_code == 201
        business_plan_id = response.data["id"]

        # update business plan and status to submitted for review
        url = reverse("businessplan-list") + f"{business_plan_id}/"
        data = _setup_new_business_plan_create
        data["status"] = "Submitted for review"
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data["id"]

        # update status to need changes
        self.client.force_authenticate(user=user)
        url = reverse("business-plan-status", kwargs={"id": new_id})
        response = self.client.put(url, {"status": "Need Changes"})
        assert response.status_code == 200

        # consolidated data update business plan, set status to secretariat draft
        url = reverse("businessplan-update-all")
        activity_data = _setup_bp_activity_create
        activity_data["agency_id"] = agency_user.agency_id
        data = {
            "year_start": 2020,
            "year_end": 2022,
            "status": "Secretariat Draft",
            "activities": [activity_data],
        }
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data[0]["id"]

        # consolidated data update business plan, set status to submitted
        url = reverse("businessplan-update-all")
        data["status"] = "Submitted"
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data[0]["id"]

        # check 5 history objects created
        history = BPHistory.objects.filter(business_plan_id=new_id)
        assert history.count() == len(VALIDATION_LIST_FULL_HISTORY)

        for valid_string, i, version, req_user in VALIDATION_LIST_FULL_HISTORY:
            assert history[i].updated_by.username == req_user
            assert valid_string in history[i].event_description.lower()
            assert history[i].bp_version == version

        # check history in API response
        url = reverse("businessplan-get")
        for full_history, valid_list in [
            (1, VALIDATION_LIST_FULL_HISTORY),
            (0, VALIDATION_LIST),
        ]:
            response = self.client.get(
                url, {"business_plan_id": new_id, "full_history": full_history}
            )
            assert response.status_code == 200

            # check same history items in get business plan
            history = response.data["history"]
            assert len(history) == len(valid_list)

            for valid_string, i, version, req_user in valid_list:
                assert history[i]["updated_by_username"] == req_user
                assert valid_string in history[i]["event_description"].lower()
                assert history[i]["bp_version"] == version
