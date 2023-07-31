import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


# pylint: disable=C8008,R0913
class TestProjectsStatus:
    client = APIClient()
    url = reverse("project-status-list")

    def test_project_status_list_anon(self):
        response = self.client.get(self.url)
        assert response.status_code == 403

    def test_project_status_list_user(self, admin_user, project_status):
        self.client.force_authenticate(user=admin_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data == [{
            "id": project_status.id,
            "name": project_status.name,
            "code": project_status.code,
            "color": project_status.color,
        }]
