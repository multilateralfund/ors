import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


class TestBPComments:
    client = APIClient()
    COMMENT_AGENCY = "comment_agency"
    COMMENT_SECRETARIAT = "comment_secretariat"

    def test_without_permission_secretariat(self, user, business_plan):
        url = reverse("business-plan-comments", kwargs={"id": business_plan.id})

        # try to create agency comment
        self.client.force_authenticate(user=user)
        data = {
            "comment_type": self.COMMENT_AGENCY,
            "comment": "Test create agency",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 400

    def test_without_permission_agency(self, agency_user, business_plan):
        url = reverse("business-plan-comments", kwargs={"id": business_plan.id})

        # try to create secretariat comment
        self.client.force_authenticate(user=agency_user)
        data = {
            "comment_type": self.COMMENT_SECRETARIAT,
            "comment": "Test create secretariat",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 400

    def test_create_comments(self, user, agency_user, business_plan):
        url = reverse("business-plan-comments", kwargs={"id": business_plan.id})

        self.client.force_authenticate(user=agency_user)
        # create agency comment
        data = {
            "comment_type": self.COMMENT_AGENCY,
            "comment": "Test create agency",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["comment_agency"] == "Test create agency"

        self.client.force_authenticate(user=user)
        # create secretariat comment
        data = {
            "comment_type": self.COMMENT_SECRETARIAT,
            "comment": "Test create secretariat",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["comment_secretariat"] == "Test create secretariat"

        # update secretariat comment
        data = {
            "comment_type": self.COMMENT_SECRETARIAT,
            "comment": "Test update secretariat",
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["comment_secretariat"] == "Test update secretariat"
