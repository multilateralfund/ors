import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.models.business_plan import BusinessPlan, BPHistory

pytestmark = pytest.mark.django_db
# pylint: disable=W0613, R0914


class TestBPHistory:
    client = APIClient()

    def test_create_history(
        self,
        bp_editor_user,
        meeting,
        decision,
        subsector_other,
        _setup_bp_activity_create,
    ):
        self.client.force_authenticate(user=bp_editor_user)
        VALIDATION_LIST = [
            ("created by user", 1, bp_editor_user.username),
            ("updated by user", 0, bp_editor_user.username),
        ]

        # create new business plan from import
        file_path = "core/api/tests/files/Test_BP2025-2027.xlsx"
        status = "Endorsed"
        year_start = 2025
        year_end = 2027
        params = (
            f"?status={status}"
            f"&year_start={year_start}"
            f"&year_end={year_end}"
            f"&meeting_id={meeting.id}"
            f"&decision_id={decision.id}"
        )
        url = reverse("bp-upload") + params

        with open(file_path, "rb") as f:
            data = {"Test_BP2025-2027.xlsx": f}
            response = self.client.post(url, data, format="multipart")

        assert response.status_code == 200
        business_plan = BusinessPlan.objects.get(
            status=status,
            year_start=year_start,
            year_end=year_end,
            meeting=meeting,
            decision=decision,
        )
        business_plan_id = business_plan.id

        # update business plan
        url = reverse("businessplan-list") + f"{business_plan_id}/"
        data = {
            "year_start": year_start,
            "year_end": year_end,
            "status": status,
            "activities": [_setup_bp_activity_create],
        }
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        new_id = response.data["id"]

        # check 2 history objects created
        history = BPHistory.objects.filter(business_plan_id=new_id)
        assert history.count() == len(VALIDATION_LIST)

        for valid_string, i, req_user in VALIDATION_LIST:
            assert history[i].updated_by.username == req_user
            assert valid_string in history[i].event_description.lower()

        # check history in API response
        url = reverse("businessplan-get")
        response = self.client.get(url, {"business_plan_id": new_id})
        assert response.status_code == 200

        # check same history items in get business plan
        history = response.data["history"]
        assert len(history) == len(VALIDATION_LIST)

        for valid_string, i, req_user in VALIDATION_LIST:
            assert history[i]["updated_by_username"] == req_user
            assert valid_string in history[i]["event_description"].lower()
