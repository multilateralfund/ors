import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.models.business_plan import BusinessPlan

pytestmark = pytest.mark.django_db


@pytest.fixture(name="test_file")
def _test_file(tmp_path):
    p = tmp_path / "adrian.csv"
    p.write_text("Asa sunt zilele mele")
    return p


class TestBPFile:
    client = APIClient()

    def test_file_upload_anon(self, business_plan):
        url = reverse("business-plan-file", kwargs={"id": business_plan.id})
        response = self.client.post(url, {})
        assert response.status_code == 403

    def test_file_upload_wrong_extension(self, user, business_plan, test_file):
        self.client.force_authenticate(user=user)
        url = reverse("business-plan-file", kwargs={"id": business_plan.id})

        # upload file with wrong extension
        data = {"adrian.txt": test_file.open()}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 400

    def test_file_upload(self, user, business_plan, test_file):
        self.client.force_authenticate(user=user)

        # upload file (POST)
        url = reverse("business-plan-file", kwargs={"id": business_plan.id})
        data = {"adrian.csv": test_file.open()}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 201
        assert response.data["feedback_filename"] == "adrian.csv"

        # check upload (GET)
        url = reverse("businessplan-list") + f"{business_plan.id}/"
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data["feedback_filename"] == "adrian.csv"

    def test_file_download(self, user, business_plan, test_file):
        self.client.force_authenticate(user=user)
        url = reverse("business-plan-file", kwargs={"id": business_plan.id})

        # upload file (POST)
        data = {"adrian.csv": test_file.open()}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 201

        # download file
        my_file = BusinessPlan.objects.get(id=business_plan.id).feedback_file
        url = reverse("business-plan-file-download", kwargs={"id": business_plan.id})
        response = self.client.get(url)

        assert response.status_code == 200
        assert response.content == my_file.read()
