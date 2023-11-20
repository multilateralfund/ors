import pytest
from rest_framework.test import APIClient


# pylint: disable=C8008,W0221
class BaseTest:
    client = APIClient()
    url = None

    def test_without_login(self, **kwargs):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        assert response.status_code == 403


class BaseProjectUtilitiesCreate(BaseTest):
    new_utility_data = None
    proj_utility_attr_name = None  # e.g. "comments"

    @pytest.fixture(autouse=True, scope="class")
    def setup(self, **args):
        raise NotImplementedError

    def test_without_login(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, self.new_utility_data, format="json")
        assert response.status_code == 403

    def test_project_utility_create(self, user, project):
        self.client.force_authenticate(user=user)
        response = self.client.post(self.url, self.new_utility_data, format="json")
        assert response.status_code == 201
        for key, value in self.new_utility_data.items():
            assert response.data[key] == value

        assert getattr(project, self.proj_utility_attr_name).count() == 1

    def test_without_project(self, user):
        self.client.force_authenticate(user=user)
        self.new_utility_data.pop("project_id")
        response = self.client.post(self.url, self.new_utility_data, format="json")
        assert response.status_code == 400
