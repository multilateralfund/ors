import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.models.business_plan import BusinessPlan, BPHistory

pytestmark = pytest.mark.django_db


@pytest.fixture(name="_setup_new_business_plan_create")
def setup_new_business_plan_create(agency):
    return {
        "agency_id": agency.id,
        "year_start": 2020,
        "year_end": 2022,
        "status": BusinessPlan.Status.draft,
    }


class TestBPHistory:
    client = APIClient()

    def test_create_history(self, user, second_user, _setup_new_business_plan_create):
        VALIDATION_LIST = [
            ("created by user", 3, 1, user.username),
            ("comments updated", 2, 1, user.username),
            ("updated by user", 1, 1, second_user.username),
            ("comments updated", 0, 1, second_user.username),
        ]

        # create new business plan
        self.client.force_authenticate(user=user)
        url = reverse("businessplan-list")
        response = self.client.post(url, _setup_new_business_plan_create, format="json")
        assert response.status_code == 201
        business_plan_id = response.data["id"]

        # add comment
        url = reverse("business-plan-comments", kwargs={"id": business_plan_id})
        response = self.client.post(
            url,
            {
                "comment_type": "comment_secretariat",
                "comment": "Test comment",
            },
            format="json",
        )
        assert response.status_code == 201

        # update business plan
        self.client.force_authenticate(user=second_user)
        url = reverse("businessplan-list") + f"{business_plan_id}/"
        data = _setup_new_business_plan_create
        data["records"] = []

        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data["id"]

        # add other comment
        url = reverse("business-plan-comments", kwargs={"id": new_id})
        response = self.client.post(
            url,
            {
                "comment_type": "comment_secretariat",
                "comment": "Test comment 2",
            },
            format="json",
        )
        assert response.status_code == 201

        # check 3 history objects created
        history = BPHistory.objects.filter(business_plan_id=new_id)
        assert history.count() == len(VALIDATION_LIST)

        for valid_string, i, version, req_user in VALIDATION_LIST:
            assert history[i].updated_by.username == req_user
            assert valid_string in history[i].event_description.lower()
            assert history[i].bp_version == version

        # check history in API response
        url = reverse("bprecord-list")
        response = self.client.get(url, {"business_plan_id": new_id})
        assert response.status_code == 200

        # check same history items in get records
        history = response.data["history"]
        assert len(history) == len(VALIDATION_LIST)

        for valid_string, i, version, req_user in VALIDATION_LIST:
            assert history[i]["updated_by_username"] == req_user
            assert valid_string in history[i]["event_description"].lower()
            assert history[i]["bp_version"] == version
