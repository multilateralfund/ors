import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.models.business_plan import BPFile

pytestmark = pytest.mark.django_db

# pylint: disable=R0913


@pytest.fixture(name="test_file")
def _test_file(tmp_path):
    p = tmp_path / "adrian.csv"
    p.write_text("Asa sunt zilele mele")
    return p


@pytest.fixture(name="bp_files_url")
def _bp_files_url(business_plan):
    url = reverse("business-plan-files")
    params = (
        f"?status={business_plan.status}"
        f"&year_start={business_plan.year_start}"
        f"&year_end={business_plan.year_end}"
    )
    return url + params


class TestBPFileUpload:
    client = APIClient()

    def test_file_upload_permissions(
        self,
        bp_files_url,
        user,
        bp_viewer_user,
        bp_editor_user,
        admin_user,
        test_file,
    ):
        data = {"adrian.csv": test_file.open()}
        # check anon permissions
        response = self.client.post(bp_files_url, data, format="multipart")
        assert response.status_code == 403

        self.client.force_authenticate(user=user)
        response = self.client.post(bp_files_url, data, format="multipart")
        assert response.status_code == 403

        self.client.force_authenticate(user=bp_viewer_user)
        response = self.client.post(bp_files_url, data, format="multipart")
        assert response.status_code == 403

        self.client.force_authenticate(user=bp_editor_user)
        response = self.client.post(bp_files_url, data, format="multipart")
        assert response.status_code == 201

        response = self.client.get(bp_files_url)
        assert response.status_code == 200
        # test delete
        file_id = response.data[0]["id"]
        data = {"file_ids": [file_id]}
        response = self.client.delete(bp_files_url, data, format="json")
        assert response.status_code == 204

        self.client.force_authenticate(user=admin_user)
        data = {"adrian.csv": test_file.open()}
        response = self.client.post(bp_files_url, data, format="multipart")
        assert response.status_code == 201

    def test_file_upload_wrong_extension(self, bp_editor_user, bp_files_url, test_file):
        self.client.force_authenticate(user=bp_editor_user)

        # upload file with wrong extension
        data = {"adrian.txt": test_file.open()}
        response = self.client.post(bp_files_url, data, format="multipart")
        assert response.status_code == 400

    def test_file_upload(self, bp_editor_user, bp_files_url, test_file, business_plan):
        self.client.force_authenticate(user=bp_editor_user)

        # upload file (POST)
        data = {"adrian.csv": test_file.open()}
        response = self.client.post(bp_files_url, data, format="multipart")
        assert response.status_code == 201

        # check file (GET)
        response = self.client.get(bp_files_url)
        assert response.status_code == 200
        assert response.data[0]["status"] == business_plan.status
        assert response.data[0]["year_start"] == business_plan.year_start
        assert response.data[0]["year_end"] == business_plan.year_end
        assert response.data[0]["filename"] == "adrian.csv"

        # test delete
        file_id = response.data[0]["id"]
        data = {"file_ids": [file_id]}
        response = self.client.delete(bp_files_url, data, format="json")
        assert response.status_code == 204

        # check delete (GET)
        response = self.client.get(bp_files_url)
        assert response.status_code == 200
        assert len(response.data) == 0


@pytest.fixture(name="bp_file_id")
def _bp_file(bp_files_url, bp_editor_user, test_file):
    client = APIClient()
    client.force_authenticate(user=bp_editor_user)

    data = {"adrian.csv": test_file.open()}
    client.post(bp_files_url, data, format="multipart")
    return BPFile.objects.get(filename="adrian.csv").id


class TestBPFileDownload:
    client = APIClient()

    def test_file_download_permissions(
        self, bp_file_id, user, bp_viewer_user, bp_editor_user, admin_user
    ):
        url = reverse("business-plan-file-download", kwargs={"id": bp_file_id})

        def _test_file_download_permissions(user, expected_status):
            self.client.force_authenticate(user=user)
            response = self.client.get(url)
            assert response.status_code == expected_status

        # check anon permissions
        _test_file_download_permissions(None, 403)
        _test_file_download_permissions(user, 403)
        _test_file_download_permissions(bp_viewer_user, 200)
        _test_file_download_permissions(bp_editor_user, 200)
        _test_file_download_permissions(admin_user, 200)

    def test_file_download(self, bp_editor_user, bp_file_id):
        self.client.force_authenticate(user=bp_editor_user)
        my_file = BPFile.objects.get(id=bp_file_id).file
        # download file
        url = reverse("business-plan-file-download", kwargs={"id": bp_file_id})
        response = self.client.get(url)

        assert response.status_code == 200
        assert response.content == my_file.read()
