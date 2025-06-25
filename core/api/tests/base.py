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


class BaseProjectUtilityCreate(BaseTest):
    new_utility_data = None
    proj_utility_attr_name = None  # e.g. "comments"

    @pytest.fixture(autouse=True)
    def setup(self, **args):
        raise NotImplementedError

    def test_without_login(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, self.new_utility_data, format="json")
        assert response.status_code == 403

    def test_as_viewer(self, viewer_user):
        self.client.force_authenticate(user=viewer_user)
        response = self.client.post(self.url, self.new_utility_data, format="json")
        assert response.status_code == 403

    def test_project_utility_create(self, secretariat_user, project):
        self.client.force_authenticate(user=secretariat_user)
        response = self.client.post(self.url, self.new_utility_data, format="json")
        assert response.status_code == 201
        for key, value in self.new_utility_data.items():
            assert response.data[key] == value

        assert getattr(project, self.proj_utility_attr_name).count() == 1

    def test_without_project(self, secretariat_user):
        self.client.force_authenticate(user=secretariat_user)
        self.new_utility_data.pop("project_id")
        response = self.client.post(self.url, self.new_utility_data, format="json")
        assert response.status_code == 400


class BaseProjectUtilityDelete(BaseTest):
    proj_utility_attr_name = None  # e.g. "comments"

    @pytest.fixture(autouse=True)
    def setup(self, **args):
        raise NotImplementedError

    def test_delete_anon(self):
        response = self.client.delete(self.url)
        assert response.status_code == 403

    def test_as_viewer(self, viewer_user):
        self.client.force_authenticate(user=viewer_user)
        response = self.client.delete(self.url)
        assert response.status_code == 403

    def test_delete(self, secretariat_user, project):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.delete(self.url)
        assert response.status_code == 204

        project.refresh_from_db()
        assert getattr(project, self.proj_utility_attr_name).count() == 0
