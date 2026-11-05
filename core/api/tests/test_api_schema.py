import pytest
from django.urls import reverse
from rest_framework.test import APIClient


pytestmark = pytest.mark.django_db


class TestAPISchema:
    client = APIClient()
    url = reverse("schema-json")

    def test_get_schema(self):
        response = self.client.get(self.url)
        assert response.status_code == 200
