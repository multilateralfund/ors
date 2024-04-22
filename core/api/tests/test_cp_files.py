import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


@pytest.fixture(name="test_file")
def _test_file(tmp_path):
    p = tmp_path / "scott.txt"
    p.write_text("Living on a Prayer!")
    return p


class TestCPFiles:
    client = APIClient()
    url = reverse("country-programme-files")

    def test_files_upload_anon(self):
        response = self.client.post(self.url, {})
        assert response.status_code == 403

    def test_files_get_anon(self):
        response = self.client.get(self.url)
        assert response.status_code == 403

    def test_files_delete_anon(self):
        response = self.client.delete(self.url)
        assert response.status_code == 403

    def test_files_upload(self, user, country_ro, test_file):
        self.client.force_authenticate(user=user)
        country_id = country_ro.id
        year = 2023

        # upload file (POST)
        params = {
            "country_id": country_id,
            "year": year,
        }
        data = {
            "files": [
                {
                    "filename": "Test.txt",
                    "file": test_file.open(),
                },
            ]
        }
        response = self.client.post(self.url, params=params, data=data)
        assert response.status_code == 201

        # check upload (GET)
        response = self.client.get(self.url, params)
        assert response.status_code == 200
        assert response.data[0]["country_id"] == country_id
        assert response.data[0]["year"] == year
        assert response.data[0]["filename"] == "Test.txt"
        assert response.data[0]["file"] == test_file.open()
        file_id = response.data[0]["id"]

        # delete file (DELETE)
        data = {
            "file_ids": [file_id],
        }
        response = self.client.delete(self.url, params=params, data=data)
        assert response.status_code == 204

        # check delete (GET)
        response = self.client.get(self.url, params)
        assert response.status_code == 200
        assert response.data == []
