import os

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


@pytest.fixture(name="test_file")
def _test_file(tmp_path):
    p = tmp_path / "adrian.csv"
    p.write_text("Asa sunt zilele mele")
    return p


@pytest.fixture(name="wrong_test_file")
def _wrong_test_file(tmp_path):
    p = tmp_path / "adrian.txt"
    p.write_text("Asa sunt zilele mele")
    return p


class TestCPFiles:
    client = APIClient()

    def test_file_upload_anon(self):
        url = reverse("country-programme-files")
        response = self.client.post(url, {})
        assert response.status_code == 403

    def test_file_upload_wrong_extension(self, user, country_ro, wrong_test_file):
        self.client.force_authenticate(user=user)
        country_id = country_ro.id
        year = 2023
        base_url = reverse("country-programme-files")
        params = f"?country_id={country_ro.id}&year={year}"
        url = base_url + params

        # upload file with wrong extension
        data = {"file": wrong_test_file.open()}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 400
        assert response.data == "File extension is not valid"

    def test_file_upload_duplicate(self, user, country_ro, test_file):
        self.client.force_authenticate(user=user)
        country_id = country_ro.id
        year = 2023
        base_url = reverse("country-programme-files")
        params = f"?country_id={country_ro.id}&year={year}"
        url = base_url + params

        # upload file
        data = {"file": test_file.open()}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 201

        # upload same file again
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 400
        assert response.data == "File with this name already exists"

    def test_file_upload(self, user, country_ro, test_file):
        self.client.force_authenticate(user=user)
        country_id = country_ro.id
        year = 2023
        base_url = reverse("country-programme-files")
        params = f"?country_id={country_ro.id}&year={year}"
        url = base_url + params

        # upload file (POST)
        file = test_file.open()
        data = {"file": file}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 201

        # check upload (GET)
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data[0]["country_id"] == country_id
        assert response.data[0]["year"] == year
        assert response.data[0]["filename"] == os.path.basename(file.name)
        file_id = response.data[0]["id"]

        # delete file (DELETE)
        data = {"file_ids": [file_id]}
        response = self.client.delete(url, data)
        assert response.status_code == 204

        # check delete (GET)
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data == []
