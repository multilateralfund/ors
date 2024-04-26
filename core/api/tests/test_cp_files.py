import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.models import CPFile

pytestmark = pytest.mark.django_db


@pytest.fixture(name="test_file")
def _test_file(tmp_path):
    p = tmp_path / "adrian.csv"
    p.write_text("Asa sunt zilele mele")
    return p


class TestCPFiles:
    client = APIClient()

    def test_file_upload_anon(self):
        url = reverse("country-programme-files")
        response = self.client.post(url, {})
        assert response.status_code == 403

    def test_file_upload_wrong_extension(self, user, country_ro, test_file):
        self.client.force_authenticate(user=user)
        base_url = reverse("country-programme-files")
        params = f"?country_id={country_ro.id}&year=2023"
        url = base_url + params

        # upload file with wrong extension
        data = {"adrian.txt": test_file.open()}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 400

    def test_file_upload_duplicate(self, user, country_ro, test_file):
        self.client.force_authenticate(user=user)
        base_url = reverse("country-programme-files")
        params = f"?country_id={country_ro.id}&year=2023"
        url = base_url + params

        # upload file
        data = {"adrian.csv": test_file.open()}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 201

        # upload same file again
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 400

    def test_file_upload(self, user, country_ro, test_file):
        self.client.force_authenticate(user=user)
        country_id = country_ro.id
        year = 2023
        base_url = reverse("country-programme-files")
        params = f"?country_id={country_id}&year={year}"
        url = base_url + params

        # upload file (POST)
        data = {"adrian.csv": test_file.open(), "adrian.doc": test_file.open()}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 201

        # check upload (GET)
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data[0]["country_id"] == country_id
        assert response.data[0]["year"] == year
        assert response.data[0]["filename"] == "adrian.doc"
        assert response.data[1]["country_id"] == country_id
        assert response.data[1]["year"] == year
        assert response.data[1]["filename"] == "adrian.csv"
        file_ids = [response.data[0]["id"], response.data[1]["id"]]

        # delete file (DELETE)
        data = {"file_ids": file_ids}
        response = self.client.delete(url, data, format="json")
        assert response.status_code == 204

        # check delete (GET)
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data == []

    def test_file_list(self, user, country_ro, test_file):
        self.client.force_authenticate(user=user)
        country_id = country_ro.id
        year = 2023

        base_url = reverse("country-programme-files")
        params = f"?country_id={country_id}&year={year}"
        url = base_url + params

        # upload file
        data = {"adrian.csv": test_file.open()}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 201

        # get file info
        url = (
            reverse("country-programme-files") + f"?country_id={country_id}&year={year}"
        )

        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data != []

    def test_file_download(self, user, country_ro, test_file):
        self.client.force_authenticate(user=user)
        country_id = country_ro.id
        year = 2023

        base_url = reverse("country-programme-files")
        params = f"?country_id={country_id}&year={year}"
        url = base_url + params

        # upload file (POST)
        data = {"adrian.csv": test_file.open()}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 201

        # download file
        my_file = CPFile.objects.get(filename="adrian.csv")
        url = reverse("country-programme-files-download", args=(my_file.id,))
        response = self.client.get(url)

        assert response.status_code == 200
        assert response.content == my_file.file.read()
